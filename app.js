const express = require('express');
const bodyParser = require('body-parser'); //do validacji
const mongoose = require('mongoose'); //do komunikacji z baza

//importuje routes
const projectsListRoutes = require('./routes/projectsList');

const app = express();

// dla rzadan zakodowanych w application/json
app.use(bodyParser.json());

// rozwiazanie dla cross-origin...
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Access-Control-Allow-Methods','GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
    next();
});

//forwarduje kazde nadchodzace rzadanie do tych roterow
app.use('/projectsList',projectsListRoutes);

//najpierw lacze sie z baza a nastepnie startuje serwer
mongoose
.connect('mongodb://127.0.0.1:13013/projects')
.then(result => {
    //console.log(result)
    app.listen(1234);
})
.catch(error => {
    console.log(error)
});

