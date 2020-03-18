const fs = require('fs-extra');
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


//##########################################
//#### upload pojedynczego pliku do repo ######
//#######################################

exports.uploadFile = (req, res, next) => {
  console.log('FILE UPLOAD')

  const fileToSave = req.file;
  const userId = req.body.userId;
  const projectId = req.body.projectId;
  const sessionId = req.body.sessionId;

  
  console.log("file to save: " +fileToSave)
  console.log("user id: " + userId)
  console.log("project id: " + projectId)
  console.log("project id: " + sessionId)

}

//##########################################
//#### tworzenie nowej sesji ######
//#######################################

exports.createNewSession = (req, res, next) => {
    console.log('CREATE NEW SESSION')
}

//##############################################
// POBIERAM LISTE PLIKOW DANEGO UZYTKOWNIKA W JEGO FOLDERZE
//###############################################
exports.getRepoFiles = (req, res, next) => {

  const userId = req.userId;
  const projectId = req.query.projectId;

  //sciezka do plikow danego usera i danego projektu
  const repoPath = appRoot + "/repo/" + userId + "/" + projectId;
  const repoStatic = userId + "/" + projectId;

  //szukam plików w bazie danych dla danego usera
  let znalezionyPE = null;
  ProjectEntry.findById(projectId)
    .then(foundPE => {
      znalezionyPE = foundPE;

      //sprawdzam czy wlacicielem jest zalogowany uzytkownik
      return User.findById(userId);
    })
    .then(user => {

      if (user._id == userId) {

        // let listOfUserFiles = znalezionyPE.files.map(file => {

        //   const urltopass = config.publicApiAddress + '/' + repoStatic + '/' + file.fileKey;

        //   let fileEntry = {
        //     key: file.fileKey,
        //     fileId: file._id,
        //     modified: file.fileModified,
        //     size: file.fileSize,
        //     url: urltopass
        //   }

        //   return fileEntry;
        // });

        let listOfSessions = [];
        let listOfContainers = [];

       // res.status(200).json({ message: 'Files for this project and user featched!', files: listOfUserFiles })

        res.status(200).json({ message: 'Files for this project and user featched!', sessions: listOfSessions, containers: listOfContainers })


      } else {
        let error = new Error('Not authorized access');
        error.statusCode = 401;
        throw error;
      }
    })
    .catch(err => {
      let error = new Error('Error with loading user files to repo');
      error.statusCode = 500;
      throw error;
    })

  // utilsForFiles.readDir(repoPath, function (filePaths) {
  //   //sciezki zawieraja pewne sciezki wiec je przeksztalcam na relatywne
  //   const userfiles = filePaths.map(path => {
  //     const relativePath = path.replace(repoPath, '');

  //     //const fileModified =  +moment().subtract(15, 'days');
  //     const fileModified = +moment(fs.statSync(path).mtime);

  //     //const fileSize = 4.2 * 1024 * 1024;
  //     const fileSize = fs.statSync(path).size;

  //     //const urltopass = config.publicApiAddress + path.replace(appRoot, '');

  //     const urltopass = config.publicApiAddress + '/' + repoStatic + relativePath;

  //     console.log(urltopass)
  //     console.log(path)
  //     console.log(relativePath)
  //     console.log(appRoot)

  //     //const urltopass = config.publicApiAddress + path.replace(appRoot, '');

  //     let fileEntry = {
  //       key: relativePath,
  //       modified: fileModified,
  //       size: fileSize,
  //       url: urltopass
  //     }
  //     return fileEntry;
  //   })
  //   res.status(200).json({ message: 'Files for this project and user featched!', files: userfiles })
  // });
}

