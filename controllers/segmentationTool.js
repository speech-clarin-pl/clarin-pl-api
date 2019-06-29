const dockerTaskController = require('./runTask');
const dockerTaskControllerOK = require('./runTaskOK');
const appRoot = require('app-root-path'); //zwraca roota aplikacji  

exports.startEntrySegmentation =  (req, res,next) => {
  

    const entryId = req.body.entryId;
    const userId = req.body.userId;  
    const projectId = req.body.projectId; 
    const sentAudioFile = req.files[0].filename;
    const senttxtFile = req.files[1].filename;   
    
    console.log(entryId)
    console.log(userId)
    console.log(projectId)
    console.log(sentAudioFile)
    console.log(senttxtFile)
    
    
            
     if(!sentAudioFile && !senttxtFile){
         const error = new Error('No audio or txt file provided');
         error.statusCode = 422;
         throw error;
     }

    // console.log("FILE SEGMENTATION");

    // //tutaj uruchamiam task z dockera
    dockerTaskControllerOK.runTaskOK(
        "forcealign",
        sentAudioFile,
        senttxtFile,
        userId,
        projectId,
        entryId)
        .then(task =>{
            console.log(' TASK ZAKONCZONY SUKCESEM');
            res.status(201).json({ message: "segmentation task finished with sucess", sentEntryId: { entryId } });
        })
        .catch(err => {
            console.log(' PROBLEM Z TASKIEM ');
            if(!err.statusCode){
                err.statusCode = 500;
            }
            res.status(500).json({ message: "Something went wrong!", sentEntryId: { entryId } });
            next(err);
        })

        //console.log('KONIEC: startFileRecognitionOK')
}