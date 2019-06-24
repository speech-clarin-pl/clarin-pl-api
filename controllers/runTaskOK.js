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

                let checkerdb = setInterval(function () {
                    console.log("waiting for task to finish....")
                    Task.findById(savedId)
                        .then(task => {
                            if (task.done) {

                                //wtedy przenosze resultaty do katalogu uzytkownika
                                const file = task.input;
                                utils.moveFileToUserRepo(projectId, userId, file)
                                    .then(dir => {
                                        console.log('Task done!');
                                        resolve(task);
                                        clearInterval(checkerdb);
                                    })
                                    .catch(err => {
                                        reject(err);
                                        clearInterval(checkerdb);
                                    })
                                
                            }
                            if (task.result) {
                                console.log('Task Result: ' + task.result);
                            }
                        })
                        .catch(error => {
                            console.log('Error: ' + error);
                            reject(error);
                            clearInterval(checkerdb);
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







