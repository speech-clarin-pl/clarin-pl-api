//importuje model wpisu projektu
const Task = require('../models/DockerTask');
const appRoot = require('app-root-path'); //zwraca roota aplikacji   
const utils = require('../utils/utils');
const moment = require('moment');
const fs = require('fs-extra');
const ProjectEntry = require('../models/projectEntry');
const ProjectFile = require('../models/projectFile');
const User = require('../models/user');
const Container = require('../models/Container')

exports.runRECO = (inputAudio, outputFile, containerId) => {
    return new Promise((resolve, reject) => {
        //tworze nowy wpis w bazie za pomoca modelu

        let checkerdb = null; //checker do odpytywania db

        const dockerTask = new Task({
            task: "recognize",
            in_progress: false,
            done: false,
            time: new Date().toUTCString(),
            input: inputAudio,
        });

        // uruchamiam usługę z dockera
        dockerTask.save()
            .then(savedTask => {

                //uruchamiam odpytywanie bazy co sekunde aby
                console.log("waiting for task to finish....")
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

                                    Container.findById(containerId)
                                        .then(foundContainer=>{
                                            const userId = foundContainer.owner;
                                            const projectId = foundContainer.project;
                                            const sessionId = foundContainer.session;
                                            
                                            const containerFolderName = utils.getFileNameWithNoExt(foundContainer.fileName);


                                            // tworze z pliku wynikowego txt odpowiedniego JSONA - na przyszłość
                                            const pathToResult = appRoot + '/repo/' + resultFile;
                                            const JSONtranscription = utils.convertTxtFileIntoJSON(pathToResult);

                                            //zapisuje tego JSONA w katalogu containera
                                            const JSONTransPath = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + containerFolderName + '/' + containerFolderName + '.json';
                            
                                            fs.writeJson(JSONTransPath, JSONtranscription).then(() => {
                                                console.log("ZAPISAŁEM TRANSKRYPCJE W JSONIE")
                                                //aktualizuje flage w kontenrze
                                                Container.findOneAndUpdate({_id: containerId},{ifREC: true, statusREC: 'done'})
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
                                                        reject(error)
                                                    })
                                            })
                                            .catch(error => {
                                                console.error(error)
                                                reject(error)
                                            })
                                        })
                                        .catch(error => {
                                            console.log('ERROR: Wrong container id');
                                            console.log(error);
                                            reject(error)
                                        })


                                } else {
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





