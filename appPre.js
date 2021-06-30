const fs = require('fs-extra');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser'); //do validacji
const mongoose = require('mongoose'); //do komunikacji z baza
const isAuth = require('./middleware/is-auth');
const chalk = require('chalk');

//importuje routes
const projectsListRoutes = require('./routes/projectsList');
const recognitionRoutes =  require('./routes/recognitionTool');
const VADRoutes =  require('./routes/VADTool');
const DIARoutes =  require('./routes/DIATool');
const SEGRoutes =  require('./routes/SEGTool');
const repoRoutes = require('./routes/repo'); 
const authRoutes =  require('./routes/auth');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const log = require('simple-node-logger').createSimpleLogger('projectLogs.log'); //logging
var cors = require('cors');

const helmet = require("helmet");

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

const app = express();

// dla żądań zakodowanych w application/json
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
//do kompresji...
app.use(compression());

//zabezpieczenia
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

app.use(
    mongoSanitize({
      onSanitize: ({ req, key }) => {
        console.log(chalk.redBright(`This request [${req.key}] is sanitized`));
      },
    }),
  );


app.use(cors(corsOptions));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Length, Content-Type, Accept, Authorization');

    if(req.method === "OPTIONS"){
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        return res.status(200).json({});
    }    
    next();
});


//static files in repo....
app.use('/repoFiles', isAuth, express.static(path.join(__dirname, '/repo')));

//app.use(serveStatic(__dirname+'/repo', { }))

//routes for different parts of requests in app
app.use('/projectsList', projectsListRoutes); //refactored
app.use('/recognition', recognitionRoutes); //refactored
app.use('/repoFiles', repoRoutes);
app.use('/vad', VADRoutes);
app.use('/dia', DIARoutes);
app.use('/seg', SEGRoutes);
app.use('/auth', authRoutes);


//error handling...
app.use((error, req, res, next) => {

    const status = error.statusCode || 500;
    const message = error.message || "Wystąpił błąd";
    const data = error.data;

    console.log(chalk.red('GLOBAL ERROR HANDLER'))
    console.log(chalk.red(message))

    let dataToReturn = null;
    let messageToReturn = null;

    //różne błędy w zależności od typu środowiska
    if (process.env.NODE_ENV == 'development') {
        dataToReturn = data;
        messageToReturn = message;
    } else if (process.env.NODE_ENV == 'production') {
        dataToReturn = {};
        messageToReturn = "Wystąpił błąd";
    } else if (process.env.NODE_ENV == 'test') {
        dataToReturn = data;
        messageToReturn = message;
    } else {
        dataToReturn = {};
        messageToReturn = "Wystąpił błąd";
    }

    res.status(status).json({ message: messageToReturn, data: dataToReturn });

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