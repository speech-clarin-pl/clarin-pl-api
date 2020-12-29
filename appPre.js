const fs = require('fs-extra');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser'); //do validacji
const mongoose = require('mongoose'); //do komunikacji z baza
const multer = require('multer'); //for handlind multipart/form-data - upload files
const appRoot = require('app-root-path'); //zwraca roota aplikacji
var serveStatic = require('serve-static');
const isAuth = require('./middleware/is-auth');
const utils = require('./utils/utils');
const uniqueFilename = require('unique-filename');
const chalk = require('chalk');
const {createNewSessionHandler} = require('./controllers/repoPanel');
const Container = require('./models/Container');


const log = require('simple-node-logger').createSimpleLogger('projectLogs.log'); //logging
var cors = require('cors');

var corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200,
  }

const config = require('./config.js');




if (process.env.NODE_ENV == 'development') {
    console.log(chalk.green("SERWER IN DEVELOPMENT MODE"))
} else if (process.env.NODE_ENV == 'production') {
    console.log(chalk.green("SERWER IN PRODUCTION MODE"))
} else if (process.env.NODE_ENV == 'test') {
    console.log(chalk.green("SERWER IN TEST MODE"))
} else {
    console.log(chalk.red("BRAK TRYBU URUCHOMIENIA SERWERA"))
}


global.__basedir = __dirname;


const compression = require('compression');

//importuje routes
const projectsListRoutes = require('./routes/projectsList');
const recognitionRoutes =  require('./routes/recognitionTool');
const VADRoutes =  require('./routes/VADTool');
const DIARoutes =  require('./routes/DIATool');
const SEGRoutes =  require('./routes/SEGTool');
//const segmentationRoutes = require('./routes/segmentationTool');
const repoRoutes = require('./routes/repo'); 
const authRoutes =  require('./routes/auth');
const projectEntry = require('./models/projectEntry');

//###############################################
//###############################################

const app = express();

app.use(cors(corsOptions));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Length, Content-Type, Accept, Authorization');
    next();
});


//multer configuration for storing files. It accepts array of files...
const fileStorageAudio = multer.diskStorage({

    destination: async (req, file, cb) => {

       // const userId = req.body.userId;
        const projectId = req.body.projectId;
        let sessionId = req.body.sessionId;
        let containerId = req.body.containerId; //tylko w przypadku TXT

        //const uniqueHash = req.body.uniqueHash;
        const uniqueHash = uniqueFilename(""); // generuje unikatowy ID dla wgrywanego pliku
        req.uniqueHash = uniqueHash;

        let errorParams = new Error("Złe ID sesji lub projektu");

        let fp;

        try {
            fp = await projectEntry.findById(projectId);
            if(fp) {
                //teraz sprawdzam czy ten projekt zawiera daną sesje
                const foundses = fp.sessionIds.indexOf(sessionId);
                if(foundses<0){
                    cb(errorParams, null);
                } 
            } else {
                cb(errorParams, null);
            }
        } catch (error) {
            error.message = "Coś poszło nie tak!"
            console.log(chalk.red(error.message))
            cb(error, null);
        }

        
        //const nowyHash = uniqueFilename("","",uniqueHash);
        //console.log(owner)
        const userId = fp.owner;
        const oryginalFileName = file.originalname;

       
        //w zalęzności czy wgrywam transkrypcje czy plik audio to albo tworze nowy folder albo wgrywam do już istniejącego
        let type = file.mimetype;
        let typeArray = type.split("/");

        let finalPath = null;

        if (typeArray[0] == "audio") {

            const conainerFolderName = utils.getFileNameWithNoExt(oryginalFileName)+"-"+uniqueHash;
            const containerFolderPath = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + conainerFolderName;

            //tworze folder dla tego contenera
            fs.mkdirsSync(containerFolderPath);
            finalPath = './repo/'+userId+'/'+projectId+'/'+sessionId+'/' + conainerFolderName;
           

        } else if (typeArray[0] == "text") {

            let conainerFolderName = null;

            //sprawdzam czy podany został container ID

            let errorParams = new Error("Złe ID kontenera dla pliku tekstowego");
   
            if(containerId){
                const foundContainer = await Container.findById(containerId);
                if(!foundContainer){
                    cb(errorParams, null);
                }
                conainerFolderName = utils.getFileNameWithNoExt(foundContainer.fileName);
                finalPath = './repo/'+userId+'/'+projectId+'/'+sessionId+'/' + conainerFolderName;
            } else {
               cb(errorParams, null);
            }
        } else {
            let mimeError = new Error("Nieakceptowalny typ pliku");
            cb(mimeError, null);
        }


        cb(null, finalPath);
    },

    filename: (req, file, cb) => {
        //const uniqueHash = req.body.uniqueHash;
        const uniqueHash = req.uniqueHash;

       // const audioFileName = utils.getFileNameWithNoExt(file.originalname)+"-"+utils.getFileExtention(file.originalname)+"-"+nowyHash;
       const audioFileName = utils.getFileNameWithNoExt(file.originalname)+"-"+uniqueHash+"_temp."+utils.getFileExtention(file.originalname);
        
       cb(null, audioFileName);
    }
    
});



const fileFilterAudio = (req, file, cb) => {
    var type = file.mimetype;
    var typeArray = type.split("/");
    if (typeArray[0] == "audio" ||
        typeArray[0] == "text") {
      cb(null, true);
    } else {
      cb(null, false);
    }
}

 // fileFilter: fileFilter
// let upload = multer({
//     storage: fileStorage,
    
// }).array('audioFiles');

let uploadAudio = multer({
    storage: fileStorageAudio,
    fileFilter: fileFilterAudio,
}).single('myFile');



app.use(uploadAudio, (req, res, next) => {
     next();
});


// dla rzadan zakodowanych w application/json
//app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

//do kompresji...
app.use(compression());

//static files in repo....
app.use('/repoFiles', isAuth, express.static(path.join(__dirname, '/repo')));

//app.use(serveStatic(__dirname+'/repo', { }))

//routes for different parts of requests in app
app.use('/projectsList', projectsListRoutes);
app.use('/recognition', recognitionRoutes);
//app.use('/segmentation', segmentationRoutes);
app.use('/repoFiles', repoRoutes);
app.use('/vad', VADRoutes);
app.use('/dia', DIARoutes);
app.use('/seg', SEGRoutes);
app.use('/auth', authRoutes);


//error handling...
app.use((error, req, res, next) => {
    console.log(chalk.red('GLOBAL ERROR HANDLER'))
    const status = error.statusCode || 500;
    const message = error.message;  //wiadomosc przekazana w konstruktorze Error
    console.log(chalk.red(message))
    const data = error.data;
    res.status(status).json({ message: message, data: data });
})

//najpierw lacze sie z baza a nastepnie startuje serwer

mongoose
    .connect(config.dbPath, {useFindAndModify: false, useNewUrlParser: true, useUnifiedTopology: true})
    .then(result => {
        console.log('DB CONNECTED');
    })
    .catch(error => {
        console.log(chalk.red(error.message))
    });
  


module.exports = app;