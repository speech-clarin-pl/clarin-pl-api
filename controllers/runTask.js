//importuje model wpisu projektu
const Task = require('../models/dockerTask');

exports.runTask = (taskType, fileAudio, fileTxt = null) => {
    
    console.log(fileAudio)
    //nazwa pliku w katalogu repo
    const audioFileName = fileAudio[0].filename;
    if(fileTxt){
        const textFileName = fileTxt[0].filename;
    }
  
    task = {
        task: taskType,
        in_progress: false,
        done: false,
        time: new Date().toUTCString(),
        //"zwraca w postaci: Wed, 19 Jun 2019 16:40:26 GMT"
        //a w workerze jest w postaci: 2019-06-19T15:23:34.767+00:00
    }

    
    switch(taskType){
        

        // case ('text_normalize' ||
        //     'ffmpeg' ||
        //     'recognize' ||
        //     'diarize' ||
        //     'vad'
        // ):
        case('recognize'):

            task = {...task, input: audioFileName};
            console.log('RUN TASK')
            console.log(task)
            break;
        case (
            'forcealign' ||
            'segmentalign'
        ):
            if(fileTxt){
                task = {...task, input: {
                    audio: audioFileName,
                    text: textFileName
                    }
                };
            }
            

            break;
        case (
            taskType === 'kws'
        ):
            task = {...task, input: {
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


            let checkerdb = setInterval(function(){
                
                Task.findById(savedId)
                    .then(task => {
                        console.log(task);
                        if(task.done) {
                            console.log('Task done!');
                            clearInterval(checkerdb);
                        }
                        if(task.result){
                            console.log('Result: ' + task.result);
                        } 
                    })
                    .catch(error => {
                        console.log('Error: ' + error);
                        clearInterval(checkerdb);
                    });
            }, 1000);

            //jak nie ma odpowiedzi to zatrzymuje po 1min
            setTimeout(()=>{
                console.log('STOPPED AS NO RESPONSE FROM DOCKER');
                clearInterval(checkerdb);
            }, 1800000);
            //docelowo na 30min czyli 1800000

            
            
        })
        .catch(error => {
            console.log("ERROR IN runTask");
            console.log(error);
        })


}

