const fs = require('fs-extra');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser'); //do validacji
const mongoose = require('mongoose'); //do komunikacji z baza
const multer = require('multer'); //for handlind multipart/form-data - upload files
const appRoot = require('app-root-path'); //zwraca roota aplikacji

const log = require('simple-node-logger').createSimpleLogger('projectLogs.log'); //logging
var cors = require('cors');

const config = require('./config.js');
const dotenv = require('dotenv');
dotenv.config();

global.__basedir = __dirname;

const compression = require('compression');

//konfiguracja jakich typow plikow oczekujemy
// const fileFilter = (req, file, cb) => {
//     if (file.mimetype === 'audio/mpeg' ||
//         file.mimetype === 'audio/mp3' ||
//         file.mimetype === 'audio/vnd.wav'
//     ) {
//         cb(null, true);
//     } else {
     
//         cb(null, false);
//     }
// }

//importuje routes
const projectsListRoutes = require('./routes/projectsList');
const recognitionRoutes =  require('./routes/recognitionTool');
const segmentationRoutes = require('./routes/segmentationTool');
const repoRoutes = require('./routes/repo');
const authRoutes =  require('./routes/auth');

//###############################################
//###############################################

const app = express();

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Length, Content-Type, Accept, Authorization');
    next();
});


// dla rzadan zakodowanych w application/json
//app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

//do kompresji...
app.use(compression());

//multer configuration for storing files. It accepts array of files...
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './repo/uploaded_temp');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname + '-' + new Date().toISOString() );
    }
});

const fileFilter = (req, file, cb) => {
    var type = file.mimetype;
    var typeArray = type.split("/");
    if (typeArray[0] == "audio") {
      cb(null, true);
    }else {
      cb(null, false);
    }
  }

let upload = multer({
    storage: fileStorage,
    fileFilter: fileFilter
}).array('audioFiles');

app.use(upload,function (req, res, next) {
     next();
});

//static files in repo....
app.use(express.static(path.join(__dirname, 'repo/')));


//routes for different parts of requests in app
app.use('/projectsList', projectsListRoutes);
app.use('/recognition', recognitionRoutes);
app.use('/segmentation', segmentationRoutes);
app.use('/repoFiles', repoRoutes);
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

