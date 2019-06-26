//importuje model wpisu projektu
const Task = require('../models/dockerTask');
const appRoot = require('app-root-path'); //zwraca roota aplikacji   
const utils = require('../utils/utils');


exports.runTaskOK = (taskType, fileAudio, fileTxt = null,
    userId, projectId, sentEntryId) => {
    return new Promise((resolve, reject) => {

        //nazwa pliku w katalogu repo
        const audioFileName = fileAudio;
        if (fileTxt) {
            const textFileName = fileTxt;
        }

        // buduje wpis do bazy danych
        task = {
            task: taskType,
            in_progress: false,
            done: false,
            time: new Date().toUTCString(),
        }

        //rozpoznaje rodzaj tasku
        switch (taskType) {
            case ('recognize'):
                task = { ...task, input: audioFileName };
                console.log('RUN TASK RECOGNIZE')
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
                // To start the loop

                console.log("waiting for task to finish....")
                let checkerdb = setInterval(function () {

                    Task.findById(savedId)
                        .then(task => {
                            if (task.done) {
                                console.log('TASK UKONCZONY Z RESULTATEM....')
                                //console.log(task)
                                if (!task.error) {

                                    //console.log('przenosze pliki do katalogu usera')
                                    //wtedy przenosze resultaty do katalogu uzytkownika
                                    const audioFile = task.input;
                                    const resultFile = task.result;
                                    //console.log(audioFile)
                                    //console.log(resultFile)

                                    utils.moveFileToUserRepo(projectId, userId, audioFile)
                                        .then(dir => {

                                            console.log('udalo sie przeniesc plik audio do katalogu usera')
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
                                            console.log('problem z przeniesieniem pliku/ow!');
                                            reject(err);

                                        });

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







