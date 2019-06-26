const fs = require('fs-extra');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser'); //do validacji
const mongoose = require('mongoose'); //do komunikacji z baza
const multer = require('multer'); //for handlind multipart/form-data - upload files
const appRoot = require('app-root-path'); //zwraca roota aplikacji
//var cors = require('cors');


global.__basedir = __dirname;

const compression = require('compression');
//const filemanagerMiddleware = require('@opuscapita/filemanager-server').middleware;
//const logger = require('@opuscapita/filemanager-server').logger;
//const env = require('./.env');


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
}


//importuje routes
const projectsListRoutes = require('./routes/projectsList');
const recognitionRoutes =  require('./routes/recognitionTool');
const repoRoutes = require('./routes/repo');
const authRoutes =  require('./routes/auth');

//####################################################
//###############################################

const app = express();


// rozwiazanie dla cross-origin...
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

//app.use(cors());

// dla rzadan zakodowanych w application/json
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

//do kompresji...
app.use(compression());






//tutaj musze odebraz zadanie o zalogowanym uzytkowniu 
//i odpowiednio wskazac do jakiego katalogu ma uploadowac pliki
app.use((req, res, next) => {

    next();
});

//konfiguracja multera - narazie akceptuje pojedynczy plik
//app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('audioFile'));
  //konfiguracja gdzie zapisywac pliki
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './repo');
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString() + '-' + file.originalname);
    }
});

let upload = multer({
    storage: fileStorage
}).array('audioFiles');

app.use(upload,function (req, res, next) {
     //to do
        next();
    });
    
 


//tutaj ustawiam katalog repo aby byl statyczny i widoczny publicznie - tymczasowo
app.use('/repo/', express.static(path.join(__dirname, 'repo/')));



// const baseUrl = process.env.BASE_URL || '/';
// const config = {
//     fsRoot: path.resolve(__dirname, './repo'),
//     rootName: 'Repozytorium'
//   };
// app.use(baseUrl, filemanagerMiddleware(config));
// app.use(baseUrl, express.static(path.resolve(__dirname, './static')));

//forwarduje kazde nadchodzace rzadanie do tych roterow
app.use('/projectsList', projectsListRoutes);
app.use('/recognition', recognitionRoutes);
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
    .connect('mongodb://127.0.0.1:27017/workers')
    .then(result => {

        app.listen(1234);
        console.log("POLACZONY")
    })
    .catch(error => {
        console.log(error)
    });

