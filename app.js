const express = require('express');
const bodyParser = require('body-parser');

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

app.listen(8080);