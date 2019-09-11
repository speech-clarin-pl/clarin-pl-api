//importuje model wpisu projektu
const Task = require('../models/dockerTask');
const appRoot = require('app-root-path'); //zwraca roota aplikacji   
const utils = require('../utils/utils');
const moment = require('moment');
const fs = require('fs-extra');
const ProjectEntry = require('../models/projectEntry');
const ProjectFile = require('../models/projectFile');
const User = require('../models/user');

exports.runTaskOK = (taskType, fileKey = null, fileId = null, fileAudio, fileTxt = null,
    userId, projectId, sentEntryId) => {
    return new Promise((resolve, reject) => {

        console.log('PARAMETRY W RUN TASK: ')
        console.log(taskType)
        console.log(fileKey) //jezeli jest przeciagniety z lokalnego to null
        console.log(fileId) //jezeli jest przeciagniety z lokalnego to null
        console.log(fileAudio)
        console.log(fileTxt)  // tylko do segmentacji
        console.log(userId)
        console.log(projectId)
        console.log(sentEntryId) // jezeli z lokalnego to null

        //nazwa pliku w katalogu repo
        const audioFileName = fileAudio;
        const textFileName = fileTxt;

        // console.log(textFileName)

        // buduje wpis do bazy danych
        task = {
            task: taskType,
            in_progress: false,
            done: false,
            time: new Date().toUTCString(),
        }

        let inputType = 0;
        //0 when only filename
        //1 when audio and text provided
        //2 when audio and keywords provided

        //rozpoznaje rodzaj tasku
        switch (taskType) {
            case ('text_normalize'):
                task = { ...task, input: audioFileName };
                inputType = 0;
                console.log('RUN TASK text_normalize')
                console.log(task)
                break;
            case ('ffmpeg'):
                task = { ...task, input: audioFileName };
                inputType = 0;
                console.log('RUN TASK ffmpeg')
                console.log(task)
                break;
            case ('recognize'):
                task = { ...task, input: audioFileName };
                inputType = 0;
                console.log('RUN TASK recognize')
                console.log(task)
                break;
            case ('diarize'):
                task = { ...task, input: audioFileName };
                inputType = 0;
                console.log('RUN TASK diarize')
                console.log(task)
                break;
            case ('vad'):
                task = { ...task, input: audioFileName };
                inputType = 0;
                console.log('RUN vad')
                console.log(task)
                break;
            case ('forcealign'):
                task = {
                    ...task,
                    input: {
                        audio: audioFileName,
                        text: textFileName
                    }
                };
                inputType = 1;
                console.log('RUN SEGMENTATION forcealign')
                console.log(task)
                break;
            case ('segmentalign'):
                task = {
                    ...task,
                    input: {
                        audio: audioFileName,
                        text: textFileName
                    }
                };
                inputType = 1;
                console.log('RUN SEGMENTATION segmentalign')
                console.log(task)
                break;
            case ('kws'):
                task = {
                    ...task,
                    input: {
                        audio: audioFileName,
                        keywords: textFileName
                    }
                };
                inputType = 2;
                console.log('RUN KWS')
                console.log(task)
                break;
            default:
                console.log("ERROR: Unknown task " + taskType);
        }

        //tworze nowy wpis w bazie za pomoca modelu
        const dockerTask = new Task({
            ...task
        });

        let savedId = null;

        // tutaj polaczeni z baza dockera i zapisanie
        //zapisuje do bazy
        dockerTask
            .save()
            .then(task => {

                savedId = task._id;
                console.log('Creacted task: ' + savedId);

                //odpytuje baze co sekunde czy ukonczony jest task

                console.log("waiting for task to finish....")
                let checkerdb = setInterval(function () {

                    Task.findById(savedId)
                        .then(task => {

                            if (task.done) {
                                console.log('TASK UKONCZONY Z RESULTATEM....')
                                console.log(task)
                                if (!task.error) {

                                    let audioFile = null; //file w uploaded_temp
                                    let resultFile = null; //results w uploaded_temp
                                    let txtFile = null;

                                    //rozpoznaje rodzaj tasku
                                    switch (inputType) {
                                        case (0):

                                            audioFile = task.input;
                                            resultFile = task.result;

                                            //najpierw znajduje plik ktory jest poddawany rozpoznawaniu w bazie danych
                                            let recognizedAudioFile = null;

                                            ProjectEntry.findById(projectId)
                                                .then(foundPE => {

                                                    //przenosze plik z rozpoznawania do katalogu uzytkownika repo i robie powiazanie w bazie danych
                                                    let moveFrom = appRoot + '/repo/uploaded_temp/' + resultFile;
                                                    
                                                    let orygFN = null;

                                                    //jezeli plik pochodzi z local 
                                                    if (fileId == null) {

                                                        //buduje fileKey sztucznie, zakladajac ze pliki zapisuja sie w katalogu my_files

                                                        //wydobywam oryginalna nazwe pliku z zakodowanej w dacie w katalogu tymczasowym
                                                        orygFN = utils.getFileNameFromEncodedMulter(audioFile)
                                                        fileKey = 'my_files/' + orygFN;
                                                        console.log("orygFN")
                                                        console.log(orygFN)
                                                    }

                                                    let resultFileName = utils.addSuffixToFileName(utils.getFileNameFromRepoKey(fileKey), '_rec', 'txt')

                                                    let moveTo = appRoot + '/repo/' + userId + '/' + projectId + '/' + utils.getRepoPathFromKey(fileKey) + '/' + resultFileName;
                                                    //console.log(foundPE)
                                                    console.log('przenosze wynik rozpoznawania')
                                                    //console.log(moveFrom)
                                                    //console.log(moveTo);


                                                    fs.move(moveFrom, moveTo, { overwrite: true })
                                                        .then(() => {

                                                            //jezeli plik pochodzi z local 
                                                            if (fileId == null) {

                                                                //przenosze go do repo uzytkownika i wstawiam go do bazy danych

                                                                let moveAudioFrom = appRoot + '/repo/uploaded_temp/' + audioFile;
                                                                let moveAudioTo = appRoot + '/repo/' + userId + '/' + projectId + '/my_files/' + orygFN;

                                                                fs.move(moveAudioFrom, moveAudioTo, { overwrite: true })
                                                                    .then(() => {

                                                                        //zapisuje pliki audio i txt w bazie
                                                                        const localAudioFile = new ProjectFile({
                                                                            name: orygFN,
                                                                            fileKey: fileKey,
                                                                            fileSize: fs.statSync(moveAudioTo).size,
                                                                            fileModified: +moment(fs.statSync(moveAudioTo).mtime),
                                                                            connectedWithFiles: [],
                                                                        });

                                                                        const recResult = new ProjectFile({
                                                                            name: resultFileName,
                                                                            fileKey: utils.getRepoPathFromKey(fileKey) + '/' + resultFileName,
                                                                            fileSize: fs.statSync(moveTo).size,
                                                                            fileModified: +moment(fs.statSync(moveTo).mtime),
                                                                            connectedWithFiles: localAudioFile._id,
                                                                        });

                                                                        localAudioFile.connectedWithFiles = recResult._id;

                                                                        //stawiam do foundPE.files nowe pliki wraz z powiazaniami do nich
                                                                        foundPE.files.push(localAudioFile);
                                                                        foundPE.files.push(recResult);

                                                                        ProjectEntry.updateOne({ "_id": projectId }, { "files": foundPE.files })
                                                                            .then(updatedEntry => {
                                                                                // teraz jeszcze czyszcze wgrane pliki z uploaded_temp
                                                                                fs.remove(appRoot + '/repo/uploaded_temp/' + audioFile)
                                                                                    .then(() => {
                                                                                        fs.remove(appRoot + '/repo/uploaded_temp/' + resultFile)
                                                                                            .then(() => {
                                                                                                resolve(task);
                                                                                            })
                                                                                            .catch((err) => {
                                                                                                console.log('nie mogłem usunac wynikowego pliku rozpoznawania z temp')
                                                                                                reject(err);
                                                                                            })
                                                                                    })
                                                                                    .catch((err) => {
                                                                                        console.log('nie mogłem usunac wynikowego pliku audio z temp')
                                                                                        reject(err);
                                                                                    })
                                                                            })

                                                                    })
                                                                    .catch(erro => {
                                                                        console.log('problem z przeniesieniem pliku audio recognition!');
                                                                        reject(err);
                                                                    })

                                                            } else {
                                                                //jezeli plik pochodzi z repo 


                                                                //wydobywam z bazy danych plik który został poddany rozpoznawaniu
                                                                recognizedAudioFile = foundPE.files.find(file => {
                                                                    return file._id == fileId
                                                                })
                                                                //console.log("recognizedAudioFile")
                                                                //console.log(recognizedAudioFile);

                                                                //sprawdzam czy przypadkiem plik txt rozpoznawania o tej samej nazwie juz nie istnieje
                                                                //jezeli tak to nie zapisuje nowego w bazie - pliki zostana nadpisane rozpoznawaniem
                                                                //na serwerze i ich zawartość bedzie sie różniła - ale nie wpis w repo

                                                                if (recognizedAudioFile.connectedWithFiles.length == 0) {
                                                                    //zapisuje plik rozpoznawania w bazie danych
                                                                    const recResult = new ProjectFile({
                                                                        name: resultFileName,
                                                                        fileKey: utils.getRepoPathFromKey(fileKey) + '/' + resultFileName,
                                                                        fileSize: fs.statSync(moveTo).size,
                                                                        fileModified: +moment(fs.statSync(moveTo).mtime),
                                                                        connectedWithFiles: recognizedAudioFile._id,
                                                                    });

                                                                    ProjectEntry.findOneAndUpdate({ "_id": projectId }, { $push: { "files": recResult } })
                                                                        .then((updatedResultFile) => {
                                                                            //console.log("updatedResultFile");
                                                                            //console.log(updatedResultFile)
                                                                            // robie powiązanie w pliku audio do pliku wyniku wynikowebo w bazie
                                                                            ProjectEntry.findOneAndUpdate({ "files": { $elemMatch: { "_id": recognizedAudioFile._id } } }, { $push: { "files.$.connectedWithFiles": recResult._id } })
                                                                                .then(updatedResultFile => {
                                                                                    // teraz jeszcze czyszcze wgrany plik audio do uploaded_temp
                                                                                    fs.remove(appRoot + '/repo/uploaded_temp/' + audioFile)
                                                                                        .then(() => {
                                                                                            resolve(task);
                                                                                        })
                                                                                })
                                                                        })
                                                                } else {
                                                                    console.log("Plik z rozpoznawaniem już istnieje o tej samej nazwie dlatego nie robie updatu w bazie!!")
                                                                    // teraz jeszcze czyszcze wgrany plik audio do uploaded_temp
                                                                    fs.remove(appRoot + '/repo/uploaded_temp/' + audioFile)
                                                                        .then(() => {
                                                                            resolve(task);
                                                                        })
                                                                }

                                                            }

                                                        })
                                                        .catch((err) => {
                                                            console.log('problem z przeniesieniem pliku wynikowego recognition!');
                                                            reject(err);
                                                        })
                                                })
                                            break;
                                        case (1):

                                            audioFile = task.input.audio;
                                            txtFile = task.input.text;
                                            resultFile = task.result;

                                            utils.moveFileToUserRepo(projectId, userId, audioFile)
                                                .then(dir => {
                                                    utils.moveFileToUserRepo(projectId, userId, txtFile)
                                                        .then(dir => {
                                                            if (task.result) {

                                                                //console.log('mamy task result')
                                                                //console.log(task)
                                                                //console.log('przenosze rezultat do katalogu usera')
                                                                utils.moveFileToUserRepo(projectId, userId, resultFile)
                                                                    .then(dir => {
                                                                        console.log('udalo sie przeniesc plik rezultatow do katalogu usera')
                                                                        resolve(task);
                                                                    })
                                                                    .catch(err => {
                                                                        console.log('error z przeniesieniem pliku rezultatow do katalogu usera!');
                                                                        reject(err);
                                                                    })
                                                            }
                                                        })
                                                        .catch(err => {
                                                            console.log('problem z przeniesieniem pliku txt!');
                                                            reject(err);
                                                        })
                                                })
                                                .catch(err => {
                                                    console.log('problem z przeniesieniem pliku audio!');
                                                    reject(err);

                                                });

                                            break;
                                        case (2):

                                            audioFile = task.input.audio;
                                            txtFile = task.input.keywords;
                                            resultFile = task.result;

                                            utils.moveFileToUserRepo(projectId, userId, audioFile)
                                                .then(dir => {
                                                    utils.moveFileToUserRepo(projectId, userId, txtFile)
                                                        .then(dir => {
                                                            if (task.result) {

                                                                //console.log('mamy task result')
                                                                //console.log(task)
                                                                //console.log('przenosze rezultat do katalogu usera')
                                                                utils.moveFileToUserRepo(projectId, userId, resultFile)
                                                                    .then(dir => {
                                                                        console.log('udalo sie przeniesc plik rezultatow do katalogu usera')
                                                                        resolve(task);
                                                                    })
                                                                    .catch(err => {
                                                                        console.log('error z przeniesieniem pliku rezultatow do katalogu usera!');
                                                                        reject(err);
                                                                    })
                                                            }
                                                        })
                                                        .catch(err => {
                                                            console.log('problem z przeniesieniem pliku txt!');
                                                            reject(err);
                                                        })
                                                })
                                                .catch(err => {
                                                    console.log('problem z przeniesieniem pliku audio!');
                                                    reject(err);

                                                });

                                            break;
                                        default:
                                            console.log("ERROR: Unknown task " + taskType);
                                    }


                                } else {
                                    console.log('WYSTAPIL ERROR W DOCKERZE!!!!!')
                                    console.log(task)
                                    clearInterval(checkerdb);
                                    reject(error);
                                }

                                clearInterval(checkerdb);
                            }

                        })
                        .catch(error => {
                            console.log('Error: ' + error);
                            clearInterval(checkerdb);
                            reject(error);
                        });
                }, 1000);

                //jak nie ma odpowiedzi w ciagu 30min to zatrzymuje
                setTimeout(() => {
                    clearInterval(checkerdb);
                }, 1800000);
                //docelowo na 30min czyli 1800000

            })
            .catch(error => {
                console.log("ERROR IN runTask");
                console.log(error);
                reject(error);
            })
    })
};







