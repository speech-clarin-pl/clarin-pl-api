const path = require('path');
const express = require('express');
const bodyParser = require('body-parser'); //do validacji
const mongoose = require('mongoose'); //do komunikacji z baza
const multer = require('multer'); //for handlind multipart/form-data - upload files

//importuje routes
const projectsListRoutes = require('./routes/projectsList');
const recognitionRoutes =  require('./routes/recognitionTool');

const app = express();

//konfiguracja gdzie zapisywac pliki
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './repo');
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
}

//konfiguracja multera - narazie akceptuje pojedynczy plik
app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('audioFile'));
//app.use(multer({storage: fileStorage, fileFilter: fileFilter}).array('audioFiles'));


// dla rzadan zakodowanych w application/json
app.use(bodyParser.json());




//tutaj ustawiam katalog repo aby byl statyczny i widoczny publicznie - tymczasowo
app.use('/repo', express.static(path.join(__dirname, 'repo')));

// rozwiazanie dla cross-origin...
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

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
    .connect('mongodb://127.0.0.1:13013/clarinApp')
    .then(result => {

        app.listen(1234);
        console.log("POLACZONY")
    })
    .catch(error => {
        console.log(error)
    });

