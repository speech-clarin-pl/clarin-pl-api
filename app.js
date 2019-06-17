const path = require('path');
const express = require('express');
const bodyParser = require('body-parser'); //do validacji
const mongoose = require('mongoose'); //do komunikacji z baza

//importuje routes
const projectsListRoutes = require('./routes/projectsList');

const app = express();

// dla rzadan zakodowanych w application/json
app.use(bodyParser.json()); 

//tutaj ustawiam katalog repo aby byl statyczny i widoczny publicznie
app.use('/repo', express.static(path.join(__dirname, 'repo')))

// rozwiazanie dla cross-origin...
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Access-Control-Allow-Methods','GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
    next();
});

//forwarduje kazde nadchodzace rzadanie do tych roterow
app.use('/projectsList',projectsListRoutes);

//error handling...
app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;  //wiadomosc przekazana w konstruktorze Error
    res.status(status).json({message: message});
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

