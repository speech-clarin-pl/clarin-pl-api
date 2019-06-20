const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser'); //do validacji
const mongoose = require('mongoose'); //do komunikacji z baza
const multer = require('multer'); //for handlind multipart/form-data - upload files

const compression = require('compression');
const filemanagerMiddleware = require('@opuscapita/filemanager-server').middleware;
const logger = require('@opuscapita/filemanager-server').logger;
const env = require('./.env');

const config = {
    fsRoot: path.resolve(__dirname, './repo'),
    rootName: 'Repozytorium'
  };

//fs.writeFileSync(
    //path.resolve(__dirname, './static/env.js'),
    //'window.env = ' + JSON.stringify(env) + ';'
//);




//importuje routes
const projectsListRoutes = require('./routes/projectsList');
const recognitionRoutes =  require('./routes/recognitionTool');

const app = express();

app.use(compression());

//konfiguracja gdzie zapisywac pliki
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './repo/');
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString() + '-' + file.originalname);
    }
});

//konfiguracja jakich typow plikow oczekujemy
const fileFilter = (req, file, cb) => {

    if (file.mimetype === 'audio/mpeg' ||
        file.mimetype === 'audio/mp3' ||
        file.mimetype === 'audio/vnd.wav'
    ) {
        cb(null, true);
    } else {
     
        cb(null, false);
    }

    //TYMCZASOWO
    //cb(null, true);
}

// dla rzadan zakodowanych w application/json
app.use(bodyParser.json());

//debaguje ...
// app.use((req, res, next) => {
//     //console.log(req);
//     next();
// });

//konfiguracja multera - narazie akceptuje pojedynczy plik
//app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('audioFile'));

app.use(multer({storage: fileStorage}).array('audioFiles'));


//tutaj ustawiam katalog repo aby byl statyczny i widoczny publicznie - tymczasowo
app.use('/repo', express.static(path.join(__dirname, 'repo')));

// rozwiazanie dla cross-origin...
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

const baseUrl = process.env.BASE_URL || '/';
app.use(baseUrl, filemanagerMiddleware(config));
//app.use(baseUrl, express.static(path.resolve(__dirname, './static')));

//forwarduje kazde nadchodzace rzadanie do tych roterow
app.use('/projectsList', projectsListRoutes);
app.use('/recognition', recognitionRoutes);

//error handling...
app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;  //wiadomosc przekazana w konstruktorze Error
    res.status(status).json({ message: message });
})

//najpierw lacze sie z baza a nastepnie startuje serwer
mongoose
    .connect('mongodb://127.0.0.1:27017/workers')
    .then(result => {

        app.listen(1234);
        console.log("POLACZONY")
    })
    .catch(error => {
        console.log(error)
    });

