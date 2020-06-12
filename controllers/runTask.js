//importuje model wpisu projektu
const Task = require('../models/DockerTask');
const appRoot = require('app-root-path'); //zwraca roota aplikacji   
const utils = require('../utils/utils');
const moment = require('moment');
const fs = require('fs-extra');
const ProjectEntry = require('../models/projectEntry');
const ProjectFile = require('../models/projectFile');
const User = require('../models/user');
const Container = require('../models/Container');
const path = require('path');



exports.runVAD = (container) => {
    return new Promise((resolve, reject) => {
        
        const userId = container.owner;
        const projectId = container.project;
        const sessionId = container.session;
    
        const audioFileName = container.fileName;       //np. lektor-fe2e3423.wav - na serwerze
        const containerFolderName = utils.getFileNameWithNoExt(audioFileName);  //np.lektor-fe2e3423 - na serwerze folder
    
        //let outputFileName = containerFolderName + ".json";
        //let outputFilePath = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + containerFolderName + '/' + outputFileName;

        let inputAudioFilePath = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + containerFolderName + '/' + audioFileName;
    
        //do dockera podaje ścieżke relatywną
        inputAudioFilePath = path.relative(appRoot + '/repo/', inputAudioFilePath);

        let checkerdb = null; //checker do odpytywania db

        const dockerTask = new Task({
            task: "vad",
            in_progress: false,
            done: false,
            time: new Date().toUTCString(),
            input: inputAudioFilePath,
        });

        // uruchamiam usługę z dockera
        dockerTask.save()
            .then(savedTask => {

                //uruchamiam odpytywanie bazy co sekunde 
                console.log("waiting VAD task to finish....")
                checkerdb = setInterval(function () {
                    Task.findById(savedTask._id)
                        .then(task=>{
                            console.log("Znalazłem task i czekam aż się ukończy....")
                            //jeżeli zmienił się jego status na ukończony
                            if (task.done) {
                                console.log("TASK DONE")
                                //i jeżeli nie ma errorów
                                if (!task.error) {
                                    const inputFilePath = task.input;
                                    const resultFile = task.result;

                                    // tworze z pliku wynikowego txt odpowiedniego JSONA - na przyszłość
                                    const pathToResult = appRoot + '/repo/' + resultFile;

                                    //zapisuje wynik VAD w katalogu containera
                                    const finalPathToResult = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + containerFolderName + '/' + containerFolderName + '_VAD.ctm';
                    
                                    //przenosze plik z wynikami do katalogu kontenera
                                    fs.moveSync(pathToResult, finalPathToResult);
                                    
                                    //aktualizuje flage w kontenrze
                                    Container.findOneAndUpdate({_id: container._id},{ifVAD: true, statusVAD: 'done'})
                                        .then(updatedContainer => {
                                            console.log("Zrobiłem update containera")
                                            console.log("Zabieram się za czyszczenie katalogu repo z pozostalosci")

                                            //teraz usuwam z dysku plik  log
                                            fs.removeSync(pathToResult+'_log.txt');

                                            //i usuwam tymczasowy plik txt
                                            fs.removeSync(pathToResult);

                                            console.log("ZROBIONE :)")
                                            resolve(updatedContainer)
                                            
                                        })
                                        .catch(error => {
                                            console.error(error)
                                            clearInterval(checkerdb);
                                            reject(error)
                                        })

                                    
                                } else {
                                    clearInterval(checkerdb);
                                    reject(task.error)
                                }

                                clearInterval(checkerdb);
                            }
                        })
                        .catch(error=>{
                            console.log("ERROR: nie mogłem znaleźć tasku: " + error)
                            clearInterval(checkerdb);
                            reject(error)
                        })
                },1000);
                
                
                //jak nie ma odpowiedzi w ciagu 30min to zatrzymuje
                setTimeout(() => {
                    clearInterval(checkerdb);
                }, 1800000);
                //docelowo na 30min czyli 1800000

            }).catch(error => {
                reject(error)
            })
    })
}


exports.runDIA = (container) => {
    return new Promise((resolve, reject) => {
        
        const userId = container.owner;
        const projectId = container.project;
        const sessionId = container.session;
    
        const audioFileName = container.fileName;       //np. lektor-fe2e3423.wav - na serwerze
        const containerFolderName = utils.getFileNameWithNoExt(audioFileName);  //np.lektor-fe2e3423 - na serwerze folder
    
        //let outputFileName = containerFolderName + ".json";
        //let outputFilePath = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + containerFolderName + '/' + outputFileName;

        let inputAudioFilePath = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + containerFolderName + '/' + audioFileName;
    
        //do dockera podaje ścieżke relatywną
        inputAudioFilePath = path.relative(appRoot + '/repo/', inputAudioFilePath);

        let checkerdb = null; //checker do odpytywania db

        const dockerTask = new Task({
            task: "diarize",
            in_progress: false,
            done: false,
            time: new Date().toUTCString(),
            input: inputAudioFilePath,
        });

        // uruchamiam usługę z dockera
        dockerTask.save()
            .then(savedTask => {

                //uruchamiam odpytywanie bazy co sekunde 
                console.log("waiting DIA task to finish....")
                checkerdb = setInterval(function () {
                    Task.findById(savedTask._id)
                        .then(task=>{
                            console.log("Znalazłem task DIA i czekam aż się ukończy....")
                            //jeżeli zmienił się jego status na ukończony
                            if (task.done) {
                                console.log("TASK DONE")
                                //i jeżeli nie ma errorów
                                if (!task.error) {
                                    const inputFilePath = task.input;
                                    const resultFile = task.result;

                                    // tworze z pliku wynikowego txt odpowiedniego JSONA - na przyszłość
                                    const pathToResult = appRoot + '/repo/' + resultFile;

                                    //zapisuje wynik DIA w katalogu containera
                                    const finalPathToResult = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + containerFolderName + '/' + containerFolderName + '_DIA.ctm';
                    
                                    //przenosze plik z wynikami do katalogu kontenera
                                    fs.moveSync(pathToResult, finalPathToResult);
                                    
                                    //aktualizuje flage w kontenrze
                                    Container.findOneAndUpdate({_id: container._id},{ifDIA: true, statusDIA: 'done'})
                                        .then(updatedContainer => {
                                            console.log("Zrobiłem update containera")
                                            console.log("Zabieram się za czyszczenie katalogu repo z pozostalosci")

                                            //teraz usuwam z dysku plik  log
                                            fs.removeSync(pathToResult+'_log.txt');

                                            //i usuwam tymczasowy plik txt
                                            fs.removeSync(pathToResult);

                                            console.log("ZROBIONE :)")
                                            resolve(updatedContainer)
                                            
                                        })
                                        .catch(error => {
                                            console.error(error)
                                            clearInterval(checkerdb);
                                            reject(error)
                                        })



                                       
                                } else {
                                    clearInterval(checkerdb);
                                    reject(task.error)
                                }

                                clearInterval(checkerdb);
                            }
                        })
                        .catch(error=>{
                            console.log("ERROR: nie mogłem znaleźć tasku: " + error)
                            clearInterval(checkerdb);
                            reject(error)
                        })
                },1000);
                
                
                //jak nie ma odpowiedzi w ciagu 30min to zatrzymuje
                setTimeout(() => {
                    clearInterval(checkerdb);
                }, 1800000);
                //docelowo na 30min czyli 1800000

            }).catch(error => {
                reject(error)
            })
    })
}



exports.runSEG = (container) => {
    return new Promise((resolve, reject) => {

        //container musi mieć najpierw wgraną transkrypcje
        if(container.ifREC == false){
            reject("Transcription was not run on this container!!");
        }
        
        const userId = container.owner;
        const projectId = container.project;
        const sessionId = container.session;

        let checkerdb = null; //checker do odpytywania db
    
        const audioFileName = container.fileName;       //np. lektor-fe2e3423.wav - na serwerze
        const containerFolderName = utils.getFileNameWithNoExt(audioFileName);  //np.lektor-fe2e3423 - na serwerze folder

        const pathToContainer = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + containerFolderName;
    
        
        //to juz mam
         const JSONTransPath = pathToContainer + '/' + containerFolderName + '.json';

        //to juz mam
        const AudioFilePath = pathToContainer + '/' + audioFileName;
        
        // to musze stworzyc - tymczasowo aby obliczyc a pózniej usuwam... bo przetrzymuje dane w jsonie
         const TXTFilePath = pathToContainer + '/' + containerFolderName + '.txt';

        // musze stworzyć tymczasowo plik txt którego zawartość wyciągam z jsona
        let txtContent = utils.convertJSONFileIntoTXT(JSONTransPath);

        // zapisuje ten plik jako surowy txt aby docker mial do niego dostep
        fs.writeFileSync(TXTFilePath, txtContent);

        // decyduje czy odpalic forcealign czy segmentalign w zaleznosci od dlugosci pliku
        // dla krotkich plików < 500kB uruchamiam forcealign, dla długich > 500kB uruchamiam segmentalign
        let inputAudioFileSize = fs.statSync(AudioFilePath).size;
        inputAudioFileSize = Math.round(inputAudioFileSize / 1000); //wielkosc w kB

        let segmentationType = "segmentalign";

        if(inputAudioFileSize < 500){
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
                audio:relativeInputAudioFilePath,
                text: relativeInputTxtFilePath,
            }
        });

        // uruchamiam usługę z dockera
        dockerTask.save()
            .then(savedTask => {

                //uruchamiam odpytywanie bazy co sekunde 
                console.log("waiting for SEGMENTATION to finish....")
                checkerdb = setInterval(function () {
                    Task.findById(savedTask._id)
                        .then(task=>{
                            console.log("Znalazłem task i czekam aż się ukończy....")
                            //jeżeli zmienił się jego status na ukończony
                            if (task.done) {
                                console.log("TASK DONE")
                                //i jeżeli nie ma errorów
                                if (!task.error) {

                                    const resultFile = task.result;
                                    const pathToResult = appRoot + '/repo/' + resultFile;

                                    const pathToDestResult = pathToContainer + '/' + resultFile;

                                    //zapisuje wynik DIA w katalogu containera
                                    const finalPathToResult = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + containerFolderName + '/' + containerFolderName + '_SEG.ctm';
                    
                                    //przenosze plik z wynikami do katalogu kontenera
                                    fs.moveSync(pathToResult, finalPathToResult);


                                    
                                    //aktualizuje flage w kontenrze
                                    Container.findOneAndUpdate({_id: container._id},{ifSEG: true, statusSEG: 'done'})
                                        .then(updatedContainer => {
                                            console.log("Zrobiłem update containera")
                                            console.log("Zabieram się za czyszczenie katalogu repo z pozostalosci")

                                            //teraz usuwam z dysku plik  log
                                            fs.removeSync(pathToResult+'_log.txt');

                                            //i usuwam tymczasowy plik txt
                                            fs.removeSync(TXTFilePath);

                                            console.log("ZROBIONE :)")
                                            resolve(updatedContainer)
                                            
                                        })
                                        .catch(error => {
                                            console.error(error)
                                            clearInterval(checkerdb);
                                            reject(error)
                                        })
                                       
                                } else {
                                    clearInterval(checkerdb);
                                    reject(task.error)
                                }

                                clearInterval(checkerdb);
                            }
                        })
                        .catch(error=>{
                            console.log("ERROR: nie mogłem znaleźć tasku: " + error)
                            clearInterval(checkerdb);
                            reject(error)
                        })
                },1000);
                
                
                //jak nie ma odpowiedzi w ciagu 30min to zatrzymuje
                setTimeout(() => {
                    clearInterval(checkerdb);
                }, 1800000);
                //docelowo na 30min czyli 1800000

            }).catch(error => {
                reject(error)
            })
    })
}




exports.runREC = (container) => {
    return new Promise((resolve, reject) => {
        
        
        const userId = container.owner;
        const projectId = container.project;
        const sessionId = container.session;
    
        const audioFileName = container.fileName;       //np. lektor-fe2e3423.wav - na serwerze
        const containerFolderName = utils.getFileNameWithNoExt(audioFileName);  //np.lektor-fe2e3423 - na serwerze folder
    
        //let outputFileName = containerFolderName + ".json";
        //let outputFilePath = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + containerFolderName + '/' + outputFileName;

        let inputAudioFilePath = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + containerFolderName + '/' + audioFileName;
    
        //do dockera podaje ścieżke relatywną
        inputAudioFilePath = path.relative(appRoot + '/repo/', inputAudioFilePath);

        let checkerdb = null; //checker do odpytywania db

        const dockerTask = new Task({
            task: "recognize",
            in_progress: false,
            done: false,
            time: new Date().toUTCString(),
            input: inputAudioFilePath,
        });

        // uruchamiam usługę z dockera
        dockerTask.save()
            .then(savedTask => {

                //uruchamiam odpytywanie bazy co sekunde 
                console.log("waiting RECO task to finish....")
                checkerdb = setInterval(function () {
                    Task.findById(savedTask._id)
                        .then(task=>{
                            console.log("Znalazłem task i czekam aż się ukończy....")
                            //jeżeli zmienił się jego status na ukończony
                            if (task.done) {
                                console.log("TASK DONE")
                                //i jeżeli nie ma errorów
                                if (!task.error) {
                                    const inputFilePath = task.input;
                                    const resultFile = task.result;

                                    // tworze z pliku wynikowego txt odpowiedniego JSONA - na przyszłość
                                    const pathToResult = appRoot + '/repo/' + resultFile;
                                    const JSONtranscription = utils.convertTxtFileIntoJSON(pathToResult);

                                    //zapisuje tego JSONA w katalogu containera
                                    const JSONTransPath = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + containerFolderName + '/' + containerFolderName + '.json';
                    
                                    fs.writeJson(JSONTransPath, JSONtranscription).then(() => {
                                        console.log("ZAPISAŁEM TRANSKRYPCJE W JSONIE")
                                        //aktualizuje flage w kontenrze
                                        Container.findOneAndUpdate({_id: container._id},{ifREC: true, statusREC: 'done'})
                                            .then(updatedContainer => {
                                                console.log("Zrobiłem update containera")

                                                console.log("Zabieram się za czyszczenie katalogu repo z pozostalosci")

                                                //teraz usuwam z dysku plik wynikowy oraz log
                                                fs.removeSync(pathToResult);
                                                fs.removeSync(pathToResult+'_log.txt');
                                                console.log("ZROBIONE :)")
                                                resolve(updatedContainer)
                                                
                                            })
                                            .catch(error => {
                                                console.error(error)
                                                clearInterval(checkerdb);
                                                reject(error)
                                            })
                                    })
                                    .catch(error => {
                                        console.error(error)
                                        clearInterval(checkerdb);
                                        reject(error)
                                    })
                                       
                                } else {
                                    clearInterval(checkerdb);
                                    reject(task.error)
                                }

                                clearInterval(checkerdb);
                            }
                        })
                        .catch(error=>{
                            console.log("ERROR: nie mogłem znaleźć tasku: " + error)
                            clearInterval(checkerdb);
                            reject(error)
                        })
                },1000);
                
                
                //jak nie ma odpowiedzi w ciagu 30min to zatrzymuje
                setTimeout(() => {
                    clearInterval(checkerdb);
                }, 1800000);
                //docelowo na 30min czyli 1800000

            }).catch(error => {
                reject(error)
            })
    })
}





