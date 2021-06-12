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
const chalk = require('chalk');
const speechRecognitionDoneHandler = require('./Handlers/speechRecognitionDoneHandler');
const speechSegmentationDoneHandler = require('./Handlers/segmentationDoneHandler');
const diarizationDoneHandler = require('./Handlers/diarizationDoneHandler');


exports.runVAD = (container) => {
    return new Promise(async (resolve, reject) => {
        
        let checkerdb = null; //checker do odpytywania db

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
        let block = true;

        checkerdb = setInterval( async () => {

            const task = await Task.findById(savedTask._id);

            if(block) console.log(chalk.green("Znalazłem VAD task i czekam aż się ukończy...."))
            block = false;

            if (task.done) {

                //i jeżeli nie ma errorów
                if (!task.error) {

                    const inputFilePath = task.input;
                    const resultFile = task.result;

                    // tworze z pliku wynikowego txt odpowiedniego JSONA - na przyszłość
                    const pathToResult = appRoot + '/repo/' + resultFile;

                    //zapisuje wynik VAD w katalogu containera
                    const finalPathToResult = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + containerFolderName + '/' + containerFolderName + '_VAD.ctm';
    
                    //przenosze plik z wynikami do katalogu kontenera
                    try{
                        fs.moveSync(pathToResult, finalPathToResult,{overwrite: true});
                    } catch {
                        clearInterval(checkerdb);
                        const err = new Error('Coś poszło nie tak z przenoszeniem plików')
                        reject(err);
                    }

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

                    //UWAGA!!  te dane wpisuje w baze danych w konener!!
                    fs.writeJsonSync(finalPathToResultJSON, segments);

                    try{
                        const ctmres = await emu.ctmVAD2tg(container);
                        const updatedContainer = await Container.findOneAndUpdate(
                            {_id: container._id},
                            {ifVAD: true, VADUserSegments: segments, statusVAD: 'done',errorMessage:''},
                            {new: true}
                            );

                        //teraz usuwam z dysku plik  log
                        fs.removeSync(pathToResult+'_log.txt');
                        //i usuwam tymczasowy plik txt
                        fs.removeSync(pathToResult);
                        clearInterval(checkerdb);
                        resolve(segments);
                    } catch (err){
                        const updatedContainer = await Container.findOneAndUpdate(
                            {_id: container._id},
                            {ifVAD: false, VADUserSegments: segments, statusVAD: 'error',errorMessage:err.message},
                            {new: true}
                            );

                        //teraz usuwam z dysku plik  log
                        fs.removeSync(pathToResult+'_log.txt');
                        //i usuwam tymczasowy plik txt
                        fs.removeSync(pathToResult);

                        clearInterval(checkerdb);
                        reject(err);
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
        }, 7200000);
        
    })
}

//refactored
exports.runDIA = (container) => {
    return new Promise(async (resolve, reject) => {

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

            let checkerdb = setInterval(async () => {

                const task = await Task.findById(savedTask._id);

                if (task.done) {
                    if (!task.error) {
                       const segments = await diarizationDoneHandler(task, container);
                       clearInterval(checkerdb);
                       resolve(segments);

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
            reject(error)
        }

    })
}

/*
//copy before refactor
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

                //uruchamiexports.runDIA = (container) => {
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
               // console.log(chalk.green("waiting DIA task to finish...."))

                let block = true;

                checkerdb = setInterval(function () {
                    Task.findById(savedTask._id)
                        .then(task=>{
                            
                            if(block) console.log(chalk.green("Znalazłem task DIA i czekam aż się ukończy...."))
                            block = false;
                            
                            //jeżeli zmienił się jego status na ukończony
                            if (task.done) {
                                //console.log("TASK DONE")
                                //i jeżeli nie ma errorów
                                if (!task.error) {
                                    const inputFilePath = task.input;
                                    const resultFile = task.result;

                                    // tworze z pliku wynikowego txt odpowiedniego JSONA - na przyszłość
                                    const pathToResult = appRoot + '/repo/' + resultFile;

                                    //zapisuje wynik DIA w katalogu containera
                                    const finalPathToResult = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + containerFolderName + '/' + containerFolderName + '_DIA.ctm';
                    
                                    //przenosze plik z wynikami do katalogu kontenera
                                    fs.moveSync(pathToResult, finalPathToResult,{overwrite: true});

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
                                            Container.findOneAndUpdate({_id: container._id},{ifDIA: true, DIAUserSegments: segments, statusDIA: 'done',errorMessage:''})
                                            .then(updatedContainer => {
                                                //console.log("Zrobiłem update containera")
                                                //console.log("Zabieram się za czyszczenie katalogu repo z pozostalosci")

                                                //teraz usuwam z dysku plik  log
                                                fs.removeSync(pathToResult+'_log.txt');

                                                //i usuwam tymczasowy plik txt
                                                fs.removeSync(pathToResult);

                                                //console.log(chalk.green("ZROBIONE :)"))
                                                
                                                resolve(segments)
                                                
                                            })
                                            .catch(error => {
                                                clearInterval(checkerdb);
                                                reject(error)
                                            })
                                    })
                                    .catch(()=>{

                                        //aktualizuje flage w kontenrze
                                        Container.findOneAndUpdate({_id: container._id},{ifDIA: true, DIAUserSegments: segments, statusDIA: 'error',errorMessage:'Coś poszło nie tak z konwersją CTM na TextGrid'})
                                        .then(updatedContainer => {
                                           
                                            //teraz usuwam z dysku plik  log
                                            fs.removeSync(pathToResult+'_log.txt');

                                            //i usuwam tymczasowy plik txt
                                            fs.removeSync(pathToResult);
                                          
                                            clearInterval(checkerdb);

                                            const error = new Error("Coś poszło nie tak z konwersją CTM na TextGrid");
                                            reject(error)
                                        })
                                        .catch(error => {
                                            clearInterval(checkerdb);
                                            reject(error)
                                        })

                                        
                                        clearInterval(checkerdb);
                                        const error = new Error("Coś poszło nie tak z konwersją CTM na TextGrid");
                                        reject("coś poszło nie tak z konwersją DIA 2 TextGrid")

                                        
                                    })
                                } else {
                                    clearInterval(checkerdb);
                                    const error = new Error(task.error);
                                    reject(error)
                                }

                                clearInterval(checkerdb);
                            }
                        })
                        .catch(error=>{
                            clearInterval(checkerdb);
                            reject(error)
                        })
                },1000);
                
                //jak nie ma odpowiedzi w ciagu 2h to zatrzymuje task
                setTimeout(() => {
                    clearInterval(checkerdb);
                }, 7200000);
              

            }).catch(error => {
                reject(error)
            })
    })
}am odpytywanie bazy co sekunde 
               // console.log(chalk.green("waiting DIA task to finish...."))

                let block = true;

                checkerdb = setInterval(function () {
                    Task.findById(savedTask._id)
                        .then(task=>{
                            
                            if(block) console.log(chalk.green("Znalazłem task DIA i czekam aż się ukończy...."))
                            block = false;
                            
                            //jeżeli zmienił się jego status na ukończony
                            if (task.done) {
                                //console.log("TASK DONE")
                                //i jeżeli nie ma errorów
                                if (!task.error) {
                                    const inputFilePath = task.input;
                                    const resultFile = task.result;

                                    // tworze z pliku wynikowego txt odpowiedniego JSONA - na przyszłość
                                    const pathToResult = appRoot + '/repo/' + resultFile;

                                    //zapisuje wynik DIA w katalogu containera
                                    const finalPathToResult = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + containerFolderName + '/' + containerFolderName + '_DIA.ctm';
                    
                                    //przenosze plik z wynikami do katalogu kontenera
                                    fs.moveSync(pathToResult, finalPathToResult,{overwrite: true});

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
                                            Container.findOneAndUpdate({_id: container._id},{ifDIA: true, DIAUserSegments: segments, statusDIA: 'done',errorMessage:''})
                                            .then(updatedContainer => {
                                                //console.log("Zrobiłem update containera")
                                                //console.log("Zabieram się za czyszczenie katalogu repo z pozostalosci")

                                                //teraz usuwam z dysku plik  log
                                                fs.removeSync(pathToResult+'_log.txt');

                                                //i usuwam tymczasowy plik txt
                                                fs.removeSync(pathToResult);

                                                //console.log(chalk.green("ZROBIONE :)"))
                                                
                                                resolve(segments)
                                                
                                            })
                                            .catch(error => {
                                                clearInterval(checkerdb);
                                                reject(error)
                                            })
                                    })
                                    .catch(()=>{

                                        //aktualizuje flage w kontenrze
                                        Container.findOneAndUpdate({_id: container._id},{ifDIA: true, DIAUserSegments: segments, statusDIA: 'error',errorMessage:'Coś poszło nie tak z konwersją CTM na TextGrid'})
                                        .then(updatedContainer => {
                                           
                                            //teraz usuwam z dysku plik  log
                                            fs.removeSync(pathToResult+'_log.txt');

                                            //i usuwam tymczasowy plik txt
                                            fs.removeSync(pathToResult);
                                          
                                            clearInterval(checkerdb);

                                            const error = new Error("Coś poszło nie tak z konwersją CTM na TextGrid");
                                            reject(error)
                                        })
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
               // console.log(chalk.green("waiting DIA task to finish...."))

                let block = true;

                checkerdb = setInterval(function () {
                    Task.findById(savedTask._id)
                        .then(task=>{
                            
                            if(block) console.log(chalk.green("Znalazłem task DIA i czekam aż się ukończy...."))
                            block = false;
                            
                            //jeżeli zmienił się jego status na ukończony
                            if (task.done) {
                                //console.log("TASK DONE")
                                //i jeżeli nie ma errorów
                                if (!task.error) {
                                    const inputFilePath = task.input;
                                    const resultFile = task.result;

                                    // tworze z pliku wynikowego txt odpowiedniego JSONA - na przyszłość
                                    const pathToResult = appRoot + '/repo/' + resultFile;

                                    //zapisuje wynik DIA w katalogu containera
                                    const finalPathToResult = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + containerFolderName + '/' + containerFolderName + '_DIA.ctm';
                    
                                    //przenosze plik z wynikami do katalogu kontenera
                                    fs.moveSync(pathToResult, finalPathToResult,{overwrite: true});

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
                                            Container.findOneAndUpdate({_id: container._id},{ifDIA: true, DIAUserSegments: segments, statusDIA: 'done',errorMessage:''})
                                            .then(updatedContainer => {
                                                //console.log("Zrobiłem update containera")
                                                //console.log("Zabieram się za czyszczenie katalogu repo z pozostalosci")

                                                //teraz usuwam z dysku plik  log
                                                fs.removeSync(pathToResult+'_log.txt');

                                                //i usuwam tymczasowy plik txt
                                                fs.removeSync(pathToResult);

                                                //console.log(chalk.green("ZROBIONE :)"))
                                                
                                                resolve(segments)
                                                
                                            })
                                            .catch(error => {
                                                clearInterval(checkerdb);
                                                reject(error)
                                            })
                                    })
                                    .catch(()=>{

                                        //aktualizuje flage w kontenrze
                                        Container.findOneAndUpdate({_id: container._id},{ifDIA: true, DIAUserSegments: segments, statusDIA: 'error',errorMessage:'Coś poszło nie tak z konwersją CTM na TextGrid'})
                                        .then(updatedContainer => {
                                           
                                            //teraz usuwam z dysku plik  log
                                            fs.removeSync(pathToResult+'_log.txt');

                                            //i usuwam tymczasowy plik txt
                                            fs.removeSync(pathToResult);
                                          
                                            clearInterval(checkerdb);

                                            const error = new Error("Coś poszło nie tak z konwersją CTM na TextGrid");
                                            reject(error)
                                        })
                                        .catch(error => {
                                            clearInterval(checkerdb);
                                            reject(error)
                                        })

                                        
                                        clearInterval(checkerdb);
                                        const error = new Error("Coś poszło nie tak z konwersją CTM na TextGrid");
                                        reject("coś poszło nie tak z konwersją DIA 2 TextGrid")

                                        
                                    })
                                } else {
                                    clearInterval(checkerdb);
                                    const error = new Error(task.error);
                                    reject(error)
                                }

                                clearInterval(checkerdb);
                            }
                        })
                        .catch(error=>{
                            clearInterval(checkerdb);
                            reject(error)
                        })
                },1000);
                
                //jak nie ma odpowiedzi w ciagu 2h to zatrzymuje task
                setTimeout(() => {
                    clearInterval(checkerdb);
                }, 7200000);
              

            }).catch(error => {
                reject(error)
            })
    })
}    .catch(error => {
                                            clearInterval(checkerdb);
                                            reject(error)
                                        })

                                        
                                        clearInterval(checkerdb);
                                        const error = new Error("Coś poszło nie tak z konwersją CTM na TextGrid");
                                        reject("coś poszło nie tak z konwersją DIA 2 TextGrid")

                                        
                                    })
                                } else {
                                    clearInterval(checkerdb);
                                    const error = new Error(task.error);
                                    reject(error)
                                }

                                clearInterval(checkerdb);
                            }
                        })
                        .catch(error=>{
                            clearInterval(checkerdb);
                            reject(error)
                        })
                },1000);
                
                //jak nie ma odpowiedzi w ciagu 2h to zatrzymuje task
                setTimeout(() => {
                    clearInterval(checkerdb);
                }, 7200000);
              

            }).catch(error => {
                reject(error)
            })
    })
}
*/

//refactored
exports.runSEG = (container) => {
    return new Promise(async (resolve, reject) => {

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

            let checkerdb = setInterval(async () => {

                const task = await Task.findById(savedTask._id);

                //jeżeli zmienił się jego status na ukończony
                if (task.done) {
                    if (!task.error) {
                        const returnedData = await speechSegmentationDoneHandler(task, container);
                        clearInterval(checkerdb);
                        resolve(returnedData);

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
            reject(error)
        }
    })
}


//refactored
exports.runREC = (container) => {
    return new Promise(async (resolve, reject) => {

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
            let checkerdb = setInterval(async () => {

                //robie co sekundę zapytanie do bazy danych
                const task = await Task.findById(savedTask._id);

                //jeżeli docker zmienił  status tasku na ukończony i nie ma bledow to obsluguje rezultaty
                if (task.done) {
                    if (!task.error) {
                        const updatedContainer = await speechRecognitionDoneHandler(task, container);
                        clearInterval(checkerdb);
                        resolve(updatedContainer);
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
            reject(error)
        }

    })
}


/*

//kopia przed refaktoringiem
exports.runREC = (container) => {
    return new Promise(async (resolve, reject) => {

        const userId = container.owner;
        const projectId = container.project;
        const sessionId = container.session;
    
        const audioFileName = container.fileName;       //np. lektor-fe2e3423.wav - na serwerze
        const containerFolderName = utils.getFileNameWithNoExt(audioFileName);  //np.lektor-fe2e3423 - na serwerze folder
    
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
        const savedTask = await dockerTask.save();
        let block = true;

        //uruchamiam odpytywanie bazy co sekunde 
        checkerdb = setInterval(async () =>{
            const task = await Task.findById(savedTask._id);
            if(block) console.log(chalk.green("Znalazłem task REC w DB i czekam aż się ukończy...."));
            block = false;
                    
            //jeżeli zmienił się jego status na ukończony
            if (task.done) {
                if (!task.error) {

                    try{
                        const inputFilePath = task.input;
                        const resultFile = task.result;

                        // tworze z pliku wynikowego txt odpowiedniego JSONA - na przyszłość
                        const pathToResult = appRoot + '/repo/' + resultFile;
                        const JSONtranscription = utils.convertTxtFileIntoJSON(pathToResult);

                        //zapisuje tego JSONA w katalogu containera
                        const JSONTransPath = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + containerFolderName + '/' + containerFolderName + '.json';
        
                        await fs.writeJson(JSONTransPath, JSONtranscription);

                            //aktualizuje flage w kontenrze
                        const updatedContainer = await Container.findOneAndUpdate({_id: container._id},
                            {ifREC: true, statusREC: 'done',errorMessage:''},{new:true});

                        const TXTTransPath = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + containerFolderName + '/' + containerFolderName + '_TXT.txt';

                        // musze stworzyć tymczasowo plik txt którego zawartość wyciągam z jsona
                        let txtContent = utils.convertJSONFileIntoTXT(JSONTransPath);

                       // console.log(chalk.bgRedBright(txtContent))

                        // zapisuje ten plik jako surowy txt aby docker mial do niego dostep
                        fs.writeFileSync(TXTTransPath, txtContent);

                        //console.log(chalk.bgGreenBright(pathToResult))
                        //console.log(chalk.bgGreenBright(TXTTransPath))
                        //fs.renameSync(pathToResult, TXTTransPath);
                        //fs.moveSync(pathToResult, TXTTransPath,{overwrite: true});
                        //fs.copySync(pathToResult, TXTTransPath,{overwrite: true});
                        
                        fs.removeSync(pathToResult);
                        fs.removeSync(pathToResult+'_log.txt');
                        clearInterval(checkerdb);
                        resolve(updatedContainer);

                        //testowo
                        //const testErro = new Error("testowy error bledu rozpoznawania");
                        //reject(testErro);
                    } catch (error) {
                        console.error(chalk.red(error.message))
                        clearInterval(checkerdb);
                        reject(error)
                    }
                        
                } else {
                    const error = new Error(task.error);
                    clearInterval(checkerdb);
                    reject(error)
                }

                clearInterval(checkerdb);
            }

        },1000);
        
        
        //jak nie ma odpowiedzi w ciagu 2h to zatrzymuje task
        setTimeout(() => {
            clearInterval(checkerdb);
        }, 7200000);
               
    })
}

*/




