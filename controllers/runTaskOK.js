//importuje model wpisu projektu
const Task = require('../models/dockerTask');
const appRoot = require('app-root-path'); //zwraca roota aplikacji   
const utils = require('../utils/utils');

exports.runTaskOK = (taskType, fileAudio, fileTxt = null,
    userId, projectId, sentEntryId) => {
    return new Promise((resolve, reject) => {

         console.log('PARAMETRY W RUN TASK: ')
         console.log(taskType)
         console.log(fileAudio)
         console.log(fileTxt)
         console.log(userId)
         console.log(projectId)
         console.log(sentEntryId)

        //nazwa pliku w katalogu repo
        const audioFileName = fileAudio;
        const textFileName = fileTxt;
    
        console.log(textFileName)

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
            case('text_normalize'):
                task = { ...task, input: audioFileName };
                inputType = 0;
                console.log('RUN TASK text_normalize')
                console.log(task)
                break;
            case('ffmpeg'):
                task = { ...task, input: audioFileName };
                inputType = 0;
                console.log('RUN TASK ffmpeg')
                console.log(task)
                break;
            case('recognize'):
                task = { ...task, input: audioFileName };
                inputType = 0;
                console.log('RUN TASK recognize')
                console.log(task)
                break;
            case('diarize'):
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
                task = { ...task, 
                    input: {
                        audio: audioFileName,
                        text: textFileName
                    } };
                inputType = 1;
                console.log('RUN SEGMENTATION forcealign')
                console.log(task)
                break;
            case ('segmentalign'):
                    task = { ...task, 
                         input: {
                            audio: audioFileName,
                            text: textFileName
                        } };
              inputType = 1;
              console.log('RUN SEGMENTATION segmentalign')
              console.log(task)
              break;
            case ('kws'):
              task = { ...task, 
                  input: {
                      audio: audioFileName,
                      keywords: textFileName
                  } };
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
                // To start the loop
                console.log("waiting for task to finish....")
                let checkerdb = setInterval(function () {

                    Task.findById(savedId)
                        .then(task => {

                            if (task.done) {
                                console.log('TASK UKONCZONY Z RESULTATEM....')
                                //console.log(task)
                                if (!task.error) {

                                    let audioFile = null;
                                    let resultFile = null;
                                    let txtFile = null;

                                    //rozpoznaje rodzaj tasku
                                    switch (inputType) {
                                        case (0):

                                            audioFile = task.input;
                                            resultFile = task.result;
                                           
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







