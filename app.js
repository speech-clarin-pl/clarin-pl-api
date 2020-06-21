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


const log = require('simple-node-logger').createSimpleLogger('projectLogs.log'); //logging
var cors = require('cors');

var corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200,
  }

const config = require('./config.js');


const dotenv = require('dotenv'); //for handling env files

if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}
  


global.__basedir = __dirname;





const compression = require('compression');

//importuje routes
const projectsListRoutes = require('./routes/projectsList');
const recognitionRoutes =  require('./routes/recognitionTool');
const VADRoutes =  require('./routes/VADTool');
const segmentationRoutes = require('./routes/segmentationTool');
const repoRoutes = require('./routes/repo'); 
const authRoutes =  require('./routes/auth');

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
const fileStorage = multer.diskStorage({

    filename: (req, file, cb) => {
        const uniqueHash = req.body.uniqueHash;

        const nowyHash = uniqueFilename("","",uniqueHash);

       // const audioFileName = utils.getFileNameWithNoExt(file.originalname)+"-"+utils.getFileExtention(file.originalname)+"-"+nowyHash;
       const audioFileName = utils.getFileNameWithNoExt(file.originalname)+"-"+nowyHash+"_temp."+utils.getFileExtention(file.originalname);
        
       cb(null, audioFileName);
    },

    destination: (req, file, cb) => {

        const userId = req.body.userId;
        const projectId = req.body.projectId;
        const sessionId = req.body.sessionId;
        const uniqueHash = req.body.uniqueHash;

        const nowyHash = uniqueFilename("","",uniqueHash);

        const oryginalFileName = file.originalname;

        //tworze folder dla wgranego pliku audio
        const conainerFolderName = utils.getFileNameWithNoExt(oryginalFileName)+"-"+nowyHash;
        //const conainerFolderName = oryginalFileName+"-"+nowyHash;
        const containerFolderPath = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + conainerFolderName;

        //tworze folder dla tego contenera
        fs.mkdirsSync(containerFolderPath);

        cb(null, './repo/'+userId+'/'+projectId+'/'+sessionId+'/' + conainerFolderName);
    },
    
});



const fileFilter = (req, file, cb) => {
    var type = file.mimetype;
//    if (file.mimetype === 'audio/mpeg' ||
//         file.mimetype === 'audio/mp3' ||
//         file.mimetype === 'audio/vnd.wav'
//     )
    var typeArray = type.split("/");
    if (typeArray[0] == "audio") {
      cb(null, true);
    }else {
      cb(null, false);
    }
  }

 // fileFilter: fileFilter
// let upload = multer({
//     storage: fileStorage,
    
// }).array('audioFiles');

let upload = multer({
    storage: fileStorage,
    fileFilter: fileFilter,
}).single('audioFile');

app.use(upload,function (req, res, next) {
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
app.use('/segmentation', segmentationRoutes);
app.use('/repoFiles', repoRoutes);
app.use('/vad', VADRoutes);
app.use('/auth', authRoutes);




//error handling...
app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;  //wiadomosc przekazana w konstruktorze Error
    const data = error.data;
    res.status(status).json({ message: message, data: data });
})

//najpierw lacze sie z baza a nastepnie startuje serwer
mongoose
    .connect(config.dbPath)
    .then(result => {

        app.listen(config.port);
        console.log('CONNECTED AND LISTENING TO THE PORT: ' + config.port);
    })
    .catch(error => {
        console.log(error)
    });

