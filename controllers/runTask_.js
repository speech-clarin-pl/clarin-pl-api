//importuje model wpisu projektu
const Task = require('../models/dockerTask');
const appRoot = require('app-root-path'); //zwraca roota aplikacji   

exports.moveFileToUserRepo = (projectId, userId, file, req, res, next  ) => {

    if (file) {
        //przenosze plik
        var dir = appRoot + '/repo/' + userId + '/' + projectId;
        fs.move('./repo/'+file, dir + '/' + file, function (err) {
            if (err) {
                return console.error(err);
            }
        });
    }
    next();
}


exports.runTask = (taskType, fileAudio, fileTxt = null,
    req, res, next,
    userId, projectId, sentEntryId, callback) => {

    console.log("PIERWSZE RUN TRASK!!!");
    console.log("fileAudio!!!");
    console.log(fileAudio)
    //nazwa pliku w katalogu repo
    const audioFileName = fileAudio;
    if (fileTxt) {
        const textFileName = fileTxt;
    }

    task = {
        task: taskType,
        in_progress: false,
        done: false,
        time: new Date().toUTCString(),
    }


    switch (taskType) {


        // case ('text_normalize' ||
        //     'ffmpeg' ||
        //     'recognize' ||
        //     'diarize' ||
        //     'vad'
        // ):
        case ('recognize'):

            task = { ...task, input: audioFileName };
            console.log('RUN TASK RECOGNIZE')
            console.log(task)
            break;
        case (
            'forcealign' ||
            'segmentalign'
        ):
            if (fileTxt) {
                task = {
                    ...task, input: {
                        audio: audioFileName,
                        text: textFileName
                    }
                };
            }


            break;
        case (
            taskType === 'kws'
        ):
            task = {
                ...task, input: {
                    audio: audioFileName,
                    text: textFileName
                }
            };

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

            savedId = task._id; // bylo inserted_id ?
            console.log('Creacted task:' + savedId);
            console.log('Waiting for completion');

            //odpytuje baze co sekunde czy ukonczony jest task
            // To start the loop


            let checkerdb = setInterval(function () {
                console.log("waiting to task finish....")
                Task.findById(savedId)
                    .then(task => {
                        //console.log(task);
                        if (task.done) {
                            console.log('Task done!');
                            //tutaj powinienem przeniesc zapisane pliki w repo do katalogu uzytkownika
                            //i dac odpowiedz przegladarce
                            //tutaj przechowuje polozenie pliku po jego przeniesieniu do katalogu zytkownika projektu
                            //const finalFileDest = appRoot + '/repo/' + userId + '/' + projectId + '/' + createdFileName;
                            callback(null, res,'Task is done!');
                            
                            clearInterval(checkerdb);
                        }
                        if (task.result) {
                            console.log('Result: ' + task.result);
                        }
                    })
                    .catch(error => {
                        console.log('Error: ' + error);
                        clearInterval(checkerdb);
                    });
            }, 1000);

            //jak nie ma odpowiedzi w ciagu 30min to zatrzymuje
            setTimeout(() => {
                console.log('STOPPED AS NO RESPONSE FROM DOCKER');
                clearInterval(checkerdb);
            }, 1800000);
            //docelowo na 30min czyli 1800000
        })
        .catch(error => {
            console.log("ERROR IN runTask");
            console.log(error);
        })

    next();
}

