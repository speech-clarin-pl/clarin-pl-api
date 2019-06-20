
 const dockerTaskController = require('./runTask');
    

// zapisuje plik na dysku i robie rozpoznawanie
exports.startFileRecognition = (req, res,next) => {
   

    const sentAudioFile = req.files;
    const sentEntryId = req.body.audioFilesIds;

    if(!sentAudioFile){
        const error = new Error('No file provided');
        error.statusCode = 422;
        throw error;
    }

    console.log("FILE RECOGNITION");

    //tutaj uruchamiam task z dockera
    dockerTaskController.runTask(
        "recognize",
        sentAudioFile
    );
   
    res.status(201).json({message: 'Received the file for recognition', sentEntryId: {sentEntryId}});
    //console.log(req);
    next();
}

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


