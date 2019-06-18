


// zapisuje plik na dysku i robie rozpoznawanie
exports.startFileRecognition = (req, res,next) => {
   
    if(!req.audioFile){
        //const error = new Error('No file provided');
        //error.statusCode = 422;
       // throw error;
    }

    //const audioFileUrl = req.audioFile.path;

    console.log("RECOGNITION");
    console.log(req.body.entryId);
    console.log(req.file);

    //console.log("czesc")
    //res.status(201).json(req);
    //console.log(req);
    next();
}