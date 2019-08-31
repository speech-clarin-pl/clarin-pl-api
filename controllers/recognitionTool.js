
const dockerTaskController = require('./runTask');
const dockerTaskControllerOK = require('./runTaskOK');
const appRoot = require('app-root-path'); //zwraca roota aplikacji    


exports.startFileRecognitionOK =  (req, res,next) => {
    const audioFrom = req.body.audioFrom;
    const projectId = req.body.projectId;          //project Id
    const userId = req.body.userId;                 //userId
    const sentEntryId = req.body.audioFilesIds;    //id audio entry

    // sprawdzam czy wysłany został plik audio 
    //czy tylko obiekt go opisujący (gdy uzytkownik przeciagnal z repo)

    let sentAudioFile;

    if(audioFrom=="local"){
        sentAudioFile = req.files[0].filename;   //audio file or object describing the audio if it comes from repo
    } else if(audioFrom=="repo"){
        sentAudioFile = req.body.audioFiles;
        //plik już jest w katalogu użytkownika - musze go tam zlokalizowac

    }


    console.log("AAAAAAA")
    console.log(sentAudioFile)

    if(!sentAudioFile){
        const error = new Error('No file provided');
        error.statusCode = 422;
        throw error;
    }

    console.log("FILE RECOGNITION");

    //tutaj uruchamiam task z dockera
    dockerTaskControllerOK.runTaskOK(
        "recognize",
        sentAudioFile,
        null,
        userId,
        projectId,
        sentEntryId)
        .then(task =>{
            console.log(' TASK ZAKONCZONY SUKCESEM');
            res.status(201).json({ message: "task finished with sucess", sentEntryId: { sentEntryId } });
        })
        .catch(err => {
            console.log(' PROBLEM Z TASKIEM ');
            if(!err.statusCode){
                err.statusCode = 500;
            }
            res.status(500).json({ message: "Something went wrong!", sentEntryId: { sentEntryId } });
            next(err);
        })

        //console.log('KONIEC: startFileRecognitionOK')
}

// zapisuje plik na dysku i robie rozpoznawanie
exports.startFileRecognition =  (req, res,next) => {
   
    const sentAudioFile = req.files[0].filename;
    const sentEntryId = req.body.audioFilesIds;

    const projectId = req.body.projectId;
    const userId = req.body.userId;
   
    //const orygFileName = req.files[0].originalname;
    const createdFileName = req.files[0].filename;
    //const whereSaved = req.files[0].path;

    //tutaj przechowuje polozenie pliku po jego przeniesieniu do katalogu zytkownika projektu
    const finalFileDest = appRoot + '/repo/' + userId + '/' + projectId + '/' + createdFileName;

    console.log(finalFileDest)
 

    if(!sentAudioFile){
        const error = new Error('No file provided');
        error.statusCode = 422;
        throw error;
    }

    console.log("FILE RECOGNITION: " + sentAudioFile);

    //tutaj uruchamiam task z dockera
   dockerTaskController.runTask(
       "recognize",
       sentAudioFile,
       null,
       req, 
       res,
       next,
       userId,
       projectId,
       sentEntryId,
       (error, response, message ) => {
           //call back when the task is done or has error
           if(error){

           } else {
            console.log('CALL BACK!!')
            console.log(response.body);
                response.status(201).json({ message: message, sentEntryId: { sentEntryId } }); 
           }
                             
       }
   );

   console.log("PO RUN TASK: ");
   //console.log(res.body);
   
};

exports.startBatchRecognition = (req, res,next) => {
   
    if(!req.files){
        const error = new Error('No file provided');
        error.statusCode = 422;
        throw error;
    }

    console.log("BATCH RECOGNITION");
    const uploadedAudioFiles = req.files;
    const uploadedAudioFilesIds = req.body.audioFilesIds;
    
    //console.log(uploadedAudioFiles);
    //console.log(uploadedAudioFilesIds);
   
    res.status(201).json({message: 'Files were uploaded correctly!',
                uploadedAudioFilesIds: uploadedAudioFilesIds});
    
    next();
}


