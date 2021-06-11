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

//refactored
//##########################################
//#### pobieram plik audio i wysyłam do klienta w celu podglądu pliku ######
//#######################################
exports.loadAudioFile = async (req, res, next) => {

  try {

    const containerId = req.params.containerId;
    const toolType = req.params.toolType;

    let error = new Error();

    if (!containerId) {
      error.message = "Nieodpowiedni parametr";
      error.statusCode = 400;
      throw error;
    }

    if (!toolType) {
      error.message = "Nieodpowiedni parametr";
      error.statusCode = 400;
      throw error;
    }

    //pobieram kontener z bazy danych
    const container = await Container.findById(containerId);

    const userId = container.owner;
    const projectId = container.project;
    const sessionId = container.session;

    //sprawdzam czy mamy uprawnienia
    //sprawdzam czy rzeczywiście mam uprawnienia do pobrania tego pliku
    const userToCheck = await User.findById(container.owner,"_id status");
    if ((userToCheck._id.toString() !== req.userId.toString()) || (userToCheck.status.toString() !== "Active")) {
      const error = new Error('Nie masz uprawnień!');
      error.statusCode = 403;
      throw error;
    }


    //sciezka do pliku dat
    const repoPath = appRoot + "/repo/" + userId + "/" + projectId + "/" + sessionId;

    // dorobić rozpoznawanie typu pliku audio do zwrócenia

    const fileToDeliver1 = utils.getFileNameWithNoExt(container.fileName) + ".wav";
    const filePath1 = repoPath + "/" + fileToDeliver1;

    res.sendFile(filePath1);

  } catch (error) {
    error.message = error.message || "Błąd z ładowaniem pliku";
    error.statusCode = error.statusCode || 500;
    next(error);
  }
}
  

//refactored
//##########################################
//#### pobieram plik dat i wysyłam do klienta w celu podglądu pliku ######
//#######################################
exports.loadBinaryAudio = async (req, res, next) => {

  try {
    const containerId = req.params.containerId;

    if (!containerId) {
      error.message = "Nieodpowiedni parametr id contenera";
      error.statusCode = 400;
      throw error;
    }

    const container = await Container.findById(containerId);

    const userId = container.owner;
    const projectId = container.project;
    const sessionId = container.session;

    //sprawdzam czy rzeczywiście mam uprawnienia do pobrania tego pliku
    const userToCheck = await User.findById(container.owner,"_id status");
    if ((userToCheck._id.toString() !== req.userId.toString()) || (userToCheck.status.toString() !== "Active")) {
      const error = new Error('Nie masz uprawnień!');
      error.statusCode = 403;
      throw error;
    }

    //sciezka do pliku dat
    const repoPath = appRoot + "/repo/" + userId + "/" + projectId + "/" + sessionId;

    const fileToDeliver1 = utils.getFileNameWithNoExt(container.fileName) + ".dat";
    const filePath1 = repoPath + "/" + fileToDeliver1;

   // fs.createReadStream(filePath).pipe(res);

    res.sendFile(filePath1);

  } catch (error) {

    error.message = error.message || "Błąd ładowania pliku dat";
    error.statusCode = error.statusCode || 500;
    next(error);

  }

  

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

