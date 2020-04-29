const fs = require('fs');
const path = require('path');

const mkdirp = require("mkdirp"); //do tworzenia folderu
const rimraf = require("rimraf");
const appRoot = require('app-root-path'); //zwraca roota aplikacji
const moment = require('moment');
const utils = require('../utils/utils');
const config = require('../config.js');

//importuje model wpisu projektu
const ProjectEntry = require('../models/projectEntry');
const ProjectFile = require('../models/projectFile');
const User = require('../models/user');
const IncomingForm = require('formidable').IncomingForm;
const Session = require('../models/Session');
const Container = require('../models/Container')


//##########################################
//#### pobieram plik audio i wysyłam do klienta w celu podglądu pliku ######
//#######################################
exports.loadAudioFile = (req, res, next) => {

  const containerId = req.params.containerId;
  const toolType = req.params.toolType;

  //console.log('ładuje dane do poglądu' + containerId);

  //pobieram kontener z bazy danych
  Container.findById(containerId)
    .then(container => {

        const userId = container.owner;
        const projectId = container.project;
        const sessionId = container.session;

        //sciezka do pliku dat
        const repoPath = appRoot + "/repo/" + userId + "/" + projectId + "/" + sessionId;

        // dorobić rozpoznawanie typu pliku audio do zwrócenia

        const fileToDeliver1 = utils.getFileNameWithNoExt(container.fileName) + ".wav";
        const filePath1 = repoPath + "/" + fileToDeliver1;
        //res.status(200).({ message: 'The data for previewing has been sent!', containerData: filePath});
        
       // res.sendFile(filePath);

        //res.set('Content-Type', 'application/json');
       // res.status(200).json({toolType: toolType});
       // res.append("toolType", toolType);
       // fs.createReadStream(filePath).pipe(res);

       res.sendFile(filePath1);
      //  res.download(filePath);

    })
 
}


//##########################################
//#### pobieram plik dat i wysyłam do klienta w celu podglądu pliku ######
//#######################################
exports.loadBinaryAudio = (req, res, next) => {

  const containerId = req.params.containerId;
  const toolType = req.params.toolType;

  //console.log('ładuje dane do poglądu' + containerId);

  //pobieram kontener z bazy danych
  Container.findById(containerId)
    .then(container => {
        const userId = container.owner;
        const projectId = container.project;
        const sessionId = container.session;

        //sciezka do pliku dat
        const repoPath = appRoot + "/repo/" + userId + "/" + projectId + "/" + sessionId;

        const fileToDeliver1 = utils.getFileNameWithNoExt(container.fileName) + ".dat";
        const filePath1 = repoPath + "/" + fileToDeliver1;
        //res.status(200).({ message: 'The data for previewing has been sent!', containerData: filePath});
        
       // res.sendFile(filePath);

        //res.set('Content-Type', 'application/json');
       // res.status(200).json({toolType: toolType});
       // res.append("toolType", toolType);
       // fs.createReadStream(filePath).pipe(res);

       res.sendFile(filePath1);
      //  res.download(filePath);

    })
 
}

