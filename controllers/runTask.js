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
const emu = require('./emu');



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
                            console.log("Znalazłem VAD task i czekam aż się ukończy....")
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

                                    //tutaj konwertuje plik ctm na format jsona aby dal sie czytac przez audio edytor
                                    //z czegos takiego
                                    //input 1 0.680 2.060 speech
                                    //input 1 2.740 3.230 speech
                                    //robimy
                                    // segments: [{
                                    //     startTime: 1,
                                    //     endTime: 3,
                                    //     editable: true,
                                    //     color: "#ff0000",
                                    //     labelText: "My label"
                                    //   },
                                    //   {
                                    //     startTime: 5,
                                    //     endTime: 6,
                                    //     editable: true,
                                    //     color: "#00ff00",
                                    //     labelText: "My Second label"
                                    //   }],

                                    //każdy segment jest w osobnej linii

                                    let segments = [];

                                    var vadSegment = fs.readFileSync(finalPathToResult).toString().split("\n");

                                    //iteruje po segmentach
                                    for(i in vadSegment) {
                                        const line = vadSegment[i];
                                        //input 1 0.680 2.060 speech

                                        //dziele wg spacji
                                        const info = line.split(" ");
                                        if(info.length > 4){

                                            const co = info[0];
                                            const kto = info[1];
                                            const start = info[2];
                                            const dlugosc = info[3];
                                            const rodzaj = info[4];

                                            const segment = {
                                                startTime: Number(parseFloat(start).toFixed(2)),
                                                endTime: Number((Number(parseFloat(start)) + Number(parseFloat(dlugosc))).toFixed(2)),
                                                editable: true,
                                                color: '#394b55',
                                                labelText: rodzaj,
                                            }

                                            segments.push(segment);

                                        }
                                    }


                                    // zapisuje plik jako json
                                    let gdziedot = finalPathToResult.lastIndexOf('.');
                                    let finalPathToResultJSON = finalPathToResult.substring(0,gdziedot) + '.json';

                                    //UWAGA!! nie używam go - te dane wpisuje w baze danych w konener!!
                                    fs.writeJsonSync(finalPathToResultJSON, segments);

                                    //convertuje na textGrid
                                    emu.ctmVAD2tg(container)
                                    .then(()=>{
                                        //aktualizuje flage w kontenrze
                                        Container.findOneAndUpdate({_id: container._id},{ifVAD: true, VADUserSegments: segments, statusVAD: 'done'})
                                        .then(updatedContainer => {

                                        
                                                    console.log("Zrobiłem update containera")
                                                    console.log("Zabieram się za czyszczenie katalogu repo z pozostalosci")

                                                    //teraz usuwam z dysku plik  log
                                                    fs.removeSync(pathToResult+'_log.txt');

                                                    //i usuwam tymczasowy plik txt
                                                    fs.removeSync(pathToResult);

                                                    console.log("ZROBIONE :)")
                                                    resolve(segments)
                                                
                                        })
                                        .catch(error => {
                                            console.error(error)
                                            clearInterval(checkerdb);
                                            reject(error)
                                        })
                                     })
                                    .catch(()=>{
                                        console.error("Coś poszło nie tak z konwersją VAD 2 TextGrid");
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

                                     //tutaj konwertuje plik ctm na format jsona aby dal sie czytac przez audio edytor
                                    //z czegos takiego
                                    //input 0 0.540 1.875 3
                                    //input 0 2.415 2.245 2
                                    //input 0 4.700 1.125 2
                                    //input 0 5.825 3.000 3
                                    //input 0 8.825 1.335 1

                                    //robimy
                                    // segments: [{
                                    //     startTime: 1,
                                    //     endTime: 3,
                                    //     editable: true,
                                    //     color: "#ff0000",
                                    //     labelText: "My label"
                                    //   },
                                    //   {
                                    //     startTime: 5,
                                    //     endTime: 6,
                                    //     editable: true,
                                    //     color: "#00ff00",
                                    //     labelText: "My Second label"
                                    //   }],

                                    //każdy segment jest w osobnej linii

                                    let segments = [];

                                    var diaSegment = fs.readFileSync(finalPathToResult).toString().split("\n");

                                     //iteruje po segmentach
                                     for(i in diaSegment) {
                                        const line = diaSegment[i];
                                        //input 1 0.680 2.060 speech

                                        //dziele wg spacji
                                        const info = line.split(" ");
                                        if(info.length > 4){

                                            const co = info[0];
                                            const kto = info[1];
                                            const start = info[2];
                                            const dlugosc = info[3];
                                            const rodzaj = info[4];

                                            const segment = {
                                                startTime: Number(parseFloat(start).toFixed(2)),
                                                endTime: Number((Number(parseFloat(start)) + Number(parseFloat(dlugosc))).toFixed(2)),
                                                editable: true,
                                                color: '#394b55',
                                                labelText: rodzaj,
                                            }

                                            segments.push(segment);

                                        }
                                    }

                                    // zapisuje plik jako json
                                    let gdziedot = finalPathToResult.lastIndexOf('.');
                                    let finalPathToResultJSON = finalPathToResult.substring(0,gdziedot) + '.json';

                                    //UWAGA!! nie używam go - te dane wpisuje w baze danych w konener!!
                                    fs.writeJsonSync(finalPathToResultJSON, segments);
                                    
                                    //convertuje na textGrid
                                    emu.ctmDIA2tg(container)
                                    .then(()=>{
                                            //aktualizuje flage w kontenrze
                                            Container.findOneAndUpdate({_id: container._id},{ifDIA: true, DIAUserSegments: segments, statusDIA: 'done'})
                                            .then(updatedContainer => {
                                                console.log("Zrobiłem update containera")
                                                console.log("Zabieram się za czyszczenie katalogu repo z pozostalosci")

                                                //teraz usuwam z dysku plik  log
                                                fs.removeSync(pathToResult+'_log.txt');

                                                //i usuwam tymczasowy plik txt
                                                fs.removeSync(pathToResult);

                                                console.log("ZROBIONE :)")
                                                resolve(segments)
                                                
                                            })
                                            .catch(error => {
                                                console.error(error)
                                                clearInterval(checkerdb);
                                                reject(error)
                                            })
                                    })
                                    .catch(()=>{
                                        console.error("coś poszło nie tak z konwersją DIA 2 TextGrid")
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


                                    //convertuje na textGrid
                                    emu.ctmSEG2tg(container)
                                    .then(()=>{
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
                                    })
                                    .catch(()=>{
                                        console.error("coś poszło nie tak z konwersją SEG to TextGrid")
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

                                                //teraz przenosze plik txt do katalogu usera i usuwam logi
                                                //fs.removeSync(pathToResult);
                                                const TXTTransPath = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + containerFolderName + '/' + containerFolderName + '_TXT.txt';
                    
                                                fs.renameSync(pathToResult, TXTTransPath);

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





