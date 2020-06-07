
//const dockerTaskController = require('./runTask');
const dockerTaskControllerOK = require('./runTaskOK_');
const appRoot = require('app-root-path'); //zwraca roota aplikacji    
const fs = require('fs-extra');
const ProjectEntry = require('../models/projectEntry');
const ProjectFile = require('../models/projectFile');
const User = require('../models/user');
const utils = require('../utils/utils');
const ffmpeg = require('ffmpeg');
const Container = require('../models/Container')

exports.startFileRecognitionOK = (req, res, next) => {
    const audioFrom = req.body.audioFrom;
    const projectId = req.body.projectId;          //project Id
    const userId = req.body.userId;                 //userId
    const sentEntryId = req.body.audioFilesIds;    //id audio entry

    // sprawdzam czy wysłany został plik audio 
    //czy tylko obiekt go opisujący (gdy uzytkownik przeciagnal z repo)

    let sentAudioFile;

    if (audioFrom == "local") {
        sentAudioFile = req.files[0].filename;   //audio file or object describing the audio if it comes from repo

        let newOryginalName = sentAudioFile;

        console.log("pochodzi z local: " + sentAudioFile)

        console.log(sentEntryId)
        if (!sentAudioFile) {
            const error = new Error('No file provided');
            error.statusCode = 422;
            throw error;
        }

        //tutaj uruchamiam task z dockera
        dockerTaskControllerOK.runTaskOK(
            "recognize",
            null,
            null,
            newOryginalName,
            null,
            userId,
            projectId,
            sentEntryId)
            .then(task => {



                console.log(' TASK ZAKONCZONY SUKCESEM');
                res.status(201).json({ message: "task finished with sucess", sentEntryId: { sentEntryId } });
            })
            .catch(err => {
                console.log(' PROBLEM Z TASKIEM ');
                if (!err.statusCode) {
                    err.statusCode = 500;
                }
                res.status(500).json({ message: "Something went wrong!", sentEntryId: { sentEntryId } });
                next(err);
            })


    } else if (audioFrom == "repo") {
        sentAudioFile = JSON.parse(req.body.audioFiles);

        if (!sentAudioFile) {
            const error = new Error('No file provided');
            error.statusCode = 422;
            throw error;
        }

        //jeżli plik pochodzi z repo,  Wyszukuje go z bazy danych i kopiuje tymczasowo do 
        //repo/uploaded_temp

        let sentFileId = sentAudioFile.fileId;

        let foundProjectEntry = null;
        ProjectEntry.findById(projectId)
            .then(foundPE => {
                foundProjectEntry = foundPE;
                return User.findById(userId);
            })
            .then(user => {
                //mam pewnosc ze to jest projekt uzytkownika...
                //wiec wyszukuje z bazy wpis dotyczacy pliku ktory zostal przeciagniety
                const draggedFile = foundProjectEntry.files.find(file => {
                    return file._id == sentFileId;
                })

                const draggedFileName = draggedFile.name;
                const draggedFileKey = draggedFile.fileKey;
                const draggedFileSize = draggedFile.fileSize;
                const draggedFileModified = draggedFile.fileModified;

                //KOPIUJE TEN PLIK DO KATALOGU 'repo/uploaded_temp' dla dokera do przetworzenia
                let fileFrom = appRoot + '/repo/' + userId + '/' + projectId + '/' + draggedFileKey;

                //buduje unikatowa nazwe dla pliku dla bezpieczenstwa dodajac date
                //let newOryginalName = utils.addSuffixToFileName(draggedFileName,userId + '-'+new Date().toISOString());
                let newOryginalName = draggedFileName + '-' + new Date().toISOString();

                let fileTo = appRoot + '/repo/uploaded_temp/' + newOryginalName;

                console.log(fileFrom)
                console.log(fileTo)

                fs.copy(fileFrom, fileTo)
                    .then(() => {
                        // gdy plik juz jest w katalogu repo/uploaded_files konwertuje go na 16khz do rozpoznawania
                        console.log("przekopiowany!")
                        try {
                            var process = new ffmpeg(fileTo);
                            process.then(function (audio) {

                                console.log("zaczynam ffmpeg")
                                audio
                                    .setAudioFrequency(16000)
                                    .setAudioChannels(1)
                                    .setAudioBitRate(256)
                                    .save(fileTo + '.wav')
                                    .then((file) => {

                                        //ponieważ byłem zmuszony przekonwertować plik dodając rozszrzenie wav
                                        //musze je teraz usunac
                                        console.log('Przekonwertowałem plik: ' + file);

                                        fs.move(file, fileTo, { overwrite: true })
                                            .then(() => {
                                                console.log('Plik został przekonwertowany!: ' + fileTo);
                                                //moge robić dalej rozpoznawanie!
                                                //tutaj uruchamiam task z dockera
                                                dockerTaskControllerOK.runTaskOK(
                                                    "recognize",
                                                    draggedFileKey,
                                                    null,
                                                    sentFileId,
                                                    null,
                                                    newOryginalName,
                                                    null,
                                                    userId,
                                                    projectId,
                                                    sentEntryId)
                                                    .then(task => {
                                                        console.log(' TASK ZAKONCZONY SUKCESEM');
                                                        res.status(201).json({ message: "task finished with sucess", sentEntryId: { sentEntryId } });
                                                    })
                                                    .catch(err => {
                                                        console.log(' PROBLEM Z TASKIEM ');
                                                        if (!err.statusCode) {
                                                            err.statusCode = 500;
                                                        }
                                                        res.status(500).json({ message: "Something went wrong!", sentEntryId: { sentEntryId } });
                                                        next(err);
                                                    })
                                                
                                            })
                                            .catch(err => {
                                                console.log('Wystąpił błąd zamiany nazwy pliku: ' + err);
                                            })
                                    })
                                    .catch(err => {
                                        console.log('Błąd przy konwersji pliku audio: ' + err);
                                    })

                            }, function (err) {
                                console.log('Error: ' + err);
                            });
                        } catch (e) {
                            console.log(e.code);
                            console.log(e.msg);
                        }

                    })
            })
    }

}

// zapisuje plik na dysku i robie rozpoznawanie
exports.startFileRecognition = (req, res, next) => {

    const sentAudioFile = req.files[0].filename;
    const sentEntryId = req.body.audioFilesIds;

    const projectId = req.body.projectId;
    const userId = req.body.userId;

    //const orygFileName = req.files[0].originalname;
    const createdFileName = req.files[0].filename;
    //const whereSaved = req.files[0].path;

    //tutaj przechowuje polozenie pliku po jego przeniesieniu do katalogu zytkownika projektu
    const finalFileDest = appRoot + '/repo/' + userId + '/' + projectId + '/' + createdFileName;

    console.log(finalFileDest)


    if (!sentAudioFile) {
        const error = new Error('No file provided');
        error.statusCode = 422;
        throw error;
    }

    console.log("FILE RECOGNITION: " + sentAudioFile);

    //tutaj uruchamiam task z dockera
    dockerTaskController.runTask(
        "recognize",
        sentAudioFile,
        null,
        req,
        res,
        next,
        userId,
        projectId,
        sentEntryId,
        (error, response, message) => {
            //call back when the task is done or has error
            if (error) {

            } else {
                console.log('CALL BACK!!')
                console.log(response.body);
                response.status(201).json({ message: message, sentEntryId: { sentEntryId } });
            }

        }
    );

    console.log("PO RUN TASK: ");
    //console.log(res.body);

};

exports.startBatchRecognition = (req, res, next) => {

    if (!req.files) {
        const error = new Error('No file provided');
        error.statusCode = 422;
        throw error;
    }

    console.log("BATCH RECOGNITION");
    const uploadedAudioFiles = req.files;
    const uploadedAudioFilesIds = req.body.audioFilesIds;

    //console.log(uploadedAudioFiles);
    //console.log(uploadedAudioFilesIds);

    res.status(201).json({
        message: 'Files were uploaded correctly!',
        uploadedAudioFilesIds: uploadedAudioFilesIds
    });

    next();
}

exports.saveTranscription = (req, res, next) => {
    const transcription =  req.body.transcription;
    //const transcription = JSON.stringify(jsonObj);

    const toolType = req.body.toolType;
    const container = req.body.container;

    const userId = container.owner;
    const projectId = container.project;
    const sessionId = container.session;

    const containerName = utils.getFileNameWithNoExt(container.fileName);
    const transfFileName = utils.getFileNameWithNoExt(container.fileName) + '.json';

    const transfPath = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + containerName + '/' + transfFileName;
  
    //tymczasowo - w przyszłości do zmiany na coś lepszego
    let toSaveTemplate = {
        "blocks" : [
            {
                "starttime" : 123456,
                "stoptime" : 124556,
                "data" : {
                    "text": transcription,
                    "type": "speech"
                }
            }
        ]
    }
    

    fs.writeJson(transfPath, toSaveTemplate)
    .then(() => {
        res.status(201).json({
            message: 'transcription saved with success!',
        });
    })
    .catch(err => {
        console.error(err)
    })

    
}

exports.loadTranscription = (req, res, next) => {

    const containerId = req.params.containerId;

    // wydobywam informacje o kontenerze z bazy danych

    Container.findById(containerId)
        .then(container => {
            const userId = container.owner;
            const projectId = container.project;
            const sessionId = container.session;

            //wydobywam i czytam plik json

            const containerName = utils.getFileNameWithNoExt(container.fileName);
            const transfFileName = utils.getFileNameWithNoExt(container.fileName) + '.json';

            const jsonpath = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + containerName + '/' + transfFileName;
  
            fs.readJson(jsonpath)
                .then(packageObj => {
                    res.status(201).json(packageObj);
                })
                .catch(err => {
                     console.error(err)
                })
        })
        .catch(error => {
            console.log(error)
        })
}
