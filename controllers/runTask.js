//importuje model wpisu projektu
const Task = require('../models/DockerTask');
const appRoot = require('app-root-path'); //zwraca roota aplikacji   
const utils = require('../utils/utils');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const speechRecognitionDoneHandler = require('./Handlers/speechRecognitionDoneHandler');
const kwsDoneHandler = require('./Handlers/kwsDoneHandler')
const speechSegmentationDoneHandler = require('./Handlers/segmentationDoneHandler');
const diarizationDoneHandler = require('./Handlers/diarizationDoneHandler');
const voiceActivityDetectionDoneHandler = require('./Handlers/voiceActivityDetectionDoneHandler');

//refactored
exports.runVAD = (container) => {
    return new Promise(async (resolve, reject) => {

        let checkerdb = null;

        try {

            const userId = container.owner;
            const projectId = container.project;
            const sessionId = container.session;
        
            const audioFileName = container.fileName;       //np. lektor-fe2e3423.wav - na serwerze
            const containerFolderName = utils.getFileNameWithNoExt(audioFileName);  //np.lektor-fe2e3423 - na serwerze folder
        
            //sciezka do pliku relatywna dla dockera
            let inputAudioFilePath = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + containerFolderName + '/' + audioFileName;
            inputAudioFilePath = path.relative(appRoot + '/repo/', inputAudioFilePath);

            //tworze task
            const dockerTask = new Task({
                task: "vad",
                in_progress: false,
                done: false,
                time: new Date().toUTCString(),
                input: inputAudioFilePath,
            });

            //uruchamiam dockera
            const savedTask = await dockerTask.save();

            checkerdb = setInterval( async () => {

                const task = await Task.findById(savedTask._id);
    
                if (task.done) {
                    if (!task.error) {

                        try{
                            const segments = await voiceActivityDetectionDoneHandler(task,container);
                            clearInterval(checkerdb);
                            resolve(segments);
                        } catch (err) {
                            clearInterval(checkerdb);
                            reject(err)
                        }
                        
                    } else {
                        clearInterval(checkerdb);
                        const err = new Error('Task zwrócił błąd')
                        reject(err);
                    }
                }
            }, 1000);
    
            //jak nie ma odpowiedzi w ciagu 2h to zatrzymuje task
            setTimeout(() => {
                clearInterval(checkerdb);
            }, 1000*60*60*2);

        } catch (error) {
            error.message = error.message || "Błąd aktywacji mowy"
            error.statusCode = error.statusCode || 500;
            clearInterval(checkerdb);
            reject(error)
        }        
    })
}


//refactored
exports.runDIA = (container) => {
    return new Promise(async (resolve, reject) => {

        let checkerdb = null;

        try {
            const userId = container.owner;
            const projectId = container.project;
            const sessionId = container.session;

            const audioFileName = container.fileName;       //np. lektor-fe2e3423.wav - na serwerze
            const containerFolderName = utils.getFileNameWithNoExt(audioFileName);  //np.lektor-fe2e3423 - na serwerze folder

            let inputAudioFilePath = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + containerFolderName + '/' + audioFileName;

            //do dockera podaje ścieżke relatywną
            inputAudioFilePath = path.relative(appRoot + '/repo/', inputAudioFilePath);

            const dockerTask = new Task({
                task: "diarize",
                in_progress: false,
                done: false,
                time: new Date().toUTCString(),
                input: inputAudioFilePath,
            });

            const savedTask = await dockerTask.save();

            checkerdb = setInterval(async () => {

                const task = await Task.findById(savedTask._id);

                if (task.done) {
                    if (!task.error) {

                        try{
                            const segments = await diarizationDoneHandler(task, container);
                            clearInterval(checkerdb);
                            resolve(segments);
                        } catch (err) {
                            clearInterval(checkerdb);
                            reject(err)
                        }
                       
                    } else {
                        const error = new Error(task.error);
                        clearInterval(checkerdb);
                        reject(error)
                    }

                    clearInterval(checkerdb);
                }
            }, 1000);

            //jak nie ma odpowiedzi w ciagu 2h to zatrzymuje task
            setTimeout(() => {
                clearInterval(checkerdb);
            }, 1000 * 60 * 60 * 2);

        } catch (error) {
            error.message = error.message || "Błąd diaryzacji"
            error.statusCode = error.statusCode || 500;
            clearInterval(checkerdb);
            reject(error)
        }

    })
}


//refactored
exports.runSEG = (container) => {
    return new Promise(async (resolve, reject) => {

        let checkerdb = null;

        try {

            const userId = container.owner;
            const projectId = container.project;
            const sessionId = container.session;

            const audioFileName = container.fileName;       //np. lektor-fe2e3423.wav - na serwerze
            const containerFolderName = utils.getFileNameWithNoExt(audioFileName);  //np.lektor-fe2e3423 - na serwerze folder

            const pathToContainer = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + containerFolderName;

            //to juz mam
            const AudioFilePath = pathToContainer + '/' + audioFileName;

            // to musze stworzyc - tymczasowo aby obliczyc a pózniej usuwam... bo przetrzymuje dane w jsonie
            const TXTFilePath = pathToContainer + '/' + containerFolderName + '_TXT.txt';

            // decyduje czy odpalic forcealign czy segmentalign w zaleznosci od dlugosci pliku
            // dla krotkich plików < 500kB uruchamiam forcealign, dla długich > 500kB uruchamiam segmentalign
            let inputAudioFileSize = fs.statSync(AudioFilePath).size;
            inputAudioFileSize = Math.round(inputAudioFileSize / 1000); //wielkosc w kB

            let segmentationType = "segmentalign";

            if (inputAudioFileSize < 500) {
                segmentationType = "forcealign";
            } else {
                segmentationType = "segmentalign";
            }

            //do dockera podaje ścieżke relatywną
            let relativeInputAudioFilePath = path.relative(appRoot + '/repo/', AudioFilePath);
            let relativeInputTxtFilePath = path.relative(appRoot + '/repo/', TXTFilePath);

            const dockerTask = new Task({
                task: segmentationType,
                in_progress: false,
                done: false,
                time: new Date().toUTCString(),
                input: {
                    audio: relativeInputAudioFilePath,
                    text: relativeInputTxtFilePath,
                }
            });

            // uruchamiam usługę z dockera
            const savedTask = await dockerTask.save();

            checkerdb = setInterval(async () => {

                const task = await Task.findById(savedTask._id);

                //jeżeli zmienił się jego status na ukończony
                if (task.done) {
                    if (!task.error) {

                        try{
                            const returnedData = await speechSegmentationDoneHandler(task, container);
                            clearInterval(checkerdb);
                            resolve(returnedData);
                        } catch (err) {
                            clearInterval(checkerdb);
                            reject(err)
                        }
                        
                    } else {
                        const error = new Error(task.error);
                        clearInterval(checkerdb);
                        reject(error);
                    }

                    clearInterval(checkerdb);
                }

            }, 1000);


            //jak nie ma odpowiedzi w ciagu 2h to zatrzymuje task
            setTimeout(() => {
                clearInterval(checkerdb);
                const error = new Error("Task segmentacji przerwany z powodu zbyt długiego działania.")
                reject(error)
            }, 1000 * 60 * 60 * 2);

        } catch (error) {
            error.message = error.message || "Błąd segmentacji"
            error.statusCode = error.statusCode || 500;
            clearInterval(checkerdb);
            reject(error)
        }
    })
}


//refactored
exports.runREC = (container) => {
    return new Promise(async (resolve, reject) => {

        let checkerdb = null;

        try {

            const userId = container.owner;
            const projectId = container.project;
            const sessionId = container.session;

            const audioFileName = container.fileName;       //np. lektor-fe2e3423.wav - na serwerze
            const containerFolderName = utils.getFileNameWithNoExt(audioFileName);  //np.lektor-fe2e3423 - na serwerze folder

            //sciezka repo do katalogu kontenera
            const containerFolderPath = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + containerFolderName;

            let inputAudioFilePath = containerFolderPath + '/' + audioFileName;

            //do dockera podaje ścieżke relatywną
            inputAudioFilePath = path.relative(appRoot + '/repo/', inputAudioFilePath);

            //buduje task w DB
            const dockerTask = new Task({
                task: "recognize",
                in_progress: false,
                done: false,
                time: new Date().toUTCString(),
                input: inputAudioFilePath,
            });

            // uruchamiam usługę z dockera zapisując task
            const savedTask = await dockerTask.save();

            //w tle docker robi swoje a ja odpytuje baze co sekunde czy juz sie ukonczylo
            checkerdb = setInterval(async () => {

                //robie co sekundę zapytanie do bazy danych
                const task = await Task.findById(savedTask._id);

                //jeżeli docker zmienił  status tasku na ukończony i nie ma bledow to obsluguje rezultaty
                if (task.done) {
                    if (!task.error) {

                        try{
                            const updatedContainer = await speechRecognitionDoneHandler(task, container);
                            clearInterval(checkerdb);
                            resolve(updatedContainer);
                        } catch (err) {
                            clearInterval(checkerdb);
                            reject(err)
                        }
                        
                    } else {
                        const error = new Error(task.error);
                        clearInterval(checkerdb);
                        reject(error)
                    }

                    //na wszelki wypadek zostawiam
                    clearInterval(checkerdb);
                }
            }, 1000);


            //jak nie ma odpowiedzi w ciagu 2h to zatrzymuje task
            setTimeout(() => {
                clearInterval(checkerdb);
                const error = new Error("Task przerwany z powodu zbyt długiego działania.")
                reject(error)
            }, 1000 * 60 * 60 * 2);

        } catch (error) {
            error.message = error.message || "Błąd rozpoznawania mowy"
            error.statusCode = error.statusCode || 500;
            clearInterval(checkerdb);
            reject(error)
        }

    })
}


//refactored
exports.runG2P = (words, alphabet, user) => {
    return new Promise(async (resolve, reject) => {

        let checkerdb = null;

        try {

            const userId = user._id;

            //slowa musze zapisać w postaci pliku tekstowego jako wejscie do dockera w katalogu usera
            const userFolderPath = appRoot + '/repo/' + userId;
            let inputWordsTxt = userFolderPath + '/' + userId+'_G2P_temp.txt';
            fs.writeFileSync(inputWordsTxt, words);

            //podaje do dockera
            const finalInputWordsTxt = path.relative(appRoot + '/repo/', inputWordsTxt);

            //buduje task w DB
            const dockerTask = new Task({
                task: "g2p",
                in_progress: false,
                done: false,
                time: new Date().toUTCString(),
                input: finalInputWordsTxt
            });

            // uruchamiam usługę z dockera zapisując task
            const savedTask = await dockerTask.save();

            //w tle docker robi swoje a ja odpytuje baze co sekunde czy juz sie ukonczylo
            checkerdb = setInterval(async () => {

                //robie co sekundę zapytanie do bazy danych
                const task = await Task.findById(savedTask._id);

                //jeżeli docker zmienił  status tasku na ukończony i nie ma bledow to obsluguje rezultaty
                if (task.done) {
                    if (!task.error) {
                        try{
                            fs.removeSync(inputWordsTxt); //usuwam bo juz nie bedzie potrzebne
                            const g2pResults = await g2pDoneHandler(task, userId);
                            clearInterval(checkerdb);
                            resolve(g2pResults);
                        } catch (err) {
                            clearInterval(checkerdb);
                            reject(err)
                        }
                        
                    } else {
                        const error = new Error(task.error);
                        clearInterval(checkerdb);
                        reject(error)
                    }

                    //na wszelki wypadek zostawiam
                    clearInterval(checkerdb);
                }
            }, 1000);


            //jak nie ma odpowiedzi w ciagu 2h to zatrzymuje task
            setTimeout(() => {
                clearInterval(checkerdb);
                const error = new Error("Task przerwany z powodu zbyt długiego działania.")
                reject(error)
            }, 1000 * 60 * 60 * 2);

        } catch (error) {
            error.message = error.message || "Błąd G2P"
            error.statusCode = error.statusCode || 500;
            clearInterval(checkerdb);
            reject(error)
        }

    })
}

//refactored
exports.runKWS = (container, keywords) => {
    return new Promise(async (resolve, reject) => {

        let checkerdb = null;

        try {

            const userId = container.owner;
            const projectId = container.project;
            const sessionId = container.session;

            const audioFileName = container.fileName;       //np. lektor-fe2e3423.wav - na serwerze
            const containerFolderName = utils.getFileNameWithNoExt(audioFileName);  //np.lektor-fe2e3423 - na serwerze folder

            //sciezka repo do katalogu kontenera
            const containerFolderPath = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + containerFolderName;

            let inputAudioFilePath = containerFolderPath + '/' + audioFileName;

            //do dockera podaje ścieżke relatywną
            inputAudioFilePath = path.relative(appRoot + '/repo/', inputAudioFilePath);

            //keywordy musze zapisać w postaci pliku tekstowego jako wejscie do dockera
            let inputKeywordsTxt = containerFolderPath + '/' + containerFolderName+'_KWS_temp.txt';

            fs.writeFileSync(inputKeywordsTxt, keywords);

            //podaje do dockera
            const finalInputKeywordsTxt = path.relative(appRoot + '/repo/', inputKeywordsTxt);

            //buduje task w DB
            const dockerTask = new Task({
                task: "kws",
                in_progress: false,
                done: false,
                time: new Date().toUTCString(),
                input: {
                    audio: inputAudioFilePath,
                    keywords: finalInputKeywordsTxt,   
                }
            });

            // uruchamiam usługę z dockera zapisując task
            const savedTask = await dockerTask.save();

            //w tle docker robi swoje a ja odpytuje baze co sekunde czy juz sie ukonczylo
            checkerdb = setInterval(async () => {

                //robie co sekundę zapytanie do bazy danych
                const task = await Task.findById(savedTask._id);

                //jeżeli docker zmienił  status tasku na ukończony i nie ma bledow to obsluguje rezultaty
                if (task.done) {
                    if (!task.error) {

                        try{
                            fs.removeSync(inputKeywordsTxt);
                            const kwsResults = await kwsDoneHandler(task, container);
                            clearInterval(checkerdb);
                            resolve(kwsResults);
                        } catch (err) {
                            clearInterval(checkerdb);
                            reject(err)
                        }
                        
                    } else {
                        const error = new Error(task.error);
                        clearInterval(checkerdb);
                        reject(error)
                    }

                    //na wszelki wypadek zostawiam
                    clearInterval(checkerdb);
                }
            }, 1000);


            //jak nie ma odpowiedzi w ciagu 2h to zatrzymuje task
            setTimeout(() => {
                clearInterval(checkerdb);
                const error = new Error("Task przerwany z powodu zbyt długiego działania.")
                reject(error)
            }, 1000 * 60 * 60 * 2);

        } catch (error) {
            error.message = error.message || "Błąd rozpoznawania słów kluczowych"
            error.statusCode = error.statusCode || 500;
            clearInterval(checkerdb);
            reject(error)
        }

    })
}




