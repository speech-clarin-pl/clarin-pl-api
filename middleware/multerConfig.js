const multer = require('multer'); 
const uniqueFilename = require('unique-filename');
const utils = require('../utils/utils');
const fs = require('fs-extra');
const chalk = require('chalk');
const projectEntry = require('../models/projectEntry');
const Container = require('../models/Container');
const appRoot = require('app-root-path'); //zwraca roota aplikacji

//multer configuration for storing files. It accepts array of files...
const fileStorageAudio = multer.diskStorage({

  destination: async (req, file, cb) => {

      const loggedUserId = req.userId;

      const projectId = req.body.projectId;
      let sessionId = req.body.sessionId;
      let containerId = req.body.containerId; //tylko w przypadku TXT

      let errorParams = new Error();

      if(!projectId) {
          errorParams.message = "Złe ID  projektu";
      }

      if(!sessionId) {
          errorParams.message = "Złe ID sesji ";
      }

      const uniqueHash = uniqueFilename(""); // generuje unikatowy ID dla wgrywanego pliku
      req.uniqueHash = uniqueHash;
      let fp;

      try {
          fp = await projectEntry.findById(projectId);
          if (fp) {
              //teraz sprawdzam czy ten projekt zawiera daną sesje
              const foundses = fp.sessionIds.indexOf(sessionId);
              if (foundses < 0) {
                  cb(errorParams, null);
              }
          } else {
              cb(errorParams, null);
          }
      } catch (error) {
          error.message = "Coś poszło nie tak!"
          console.log(chalk.red(error.message))
          cb(error, null);
      }

      
      const userId = fp.owner;
      const oryginalFileName = file.originalname;

      //sprawdzam czy rzeczywiście jestem właścicielem danego projektu
      if((loggedUserId+"") !== (userId+"")){
          errorParams.message = "Nie masz uprawnień do wykonania tej operacji";
          cb(errorParams, null);
      }

      //w zalęzności czy wgrywam transkrypcje czy plik audio to albo tworze nowy folder albo wgrywam do już istniejącego
      let type = file.mimetype;
      let typeArray = type.split("/");

      let finalPath = null;

      if (typeArray[0] == "audio") {

          const conainerFolderName = utils.getFileNameWithNoExt(oryginalFileName)+"-"+uniqueHash;
          const containerFolderPath = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + conainerFolderName;

          //tworze folder dla tego contenera
          try{
              fs.mkdirsSync(containerFolderPath);
          } catch (error) {
              cb(error, null);
          }


          //finalPath = './repo/'+userId+'/'+projectId+'/'+sessionId+'/' + conainerFolderName;
          finalPath = containerFolderPath;
          
      
      } else if (typeArray[0] == "text") {

          //sprawdzam czy podany został container ID
          let errorParams = new Error("Złe ID kontenera dla pliku tekstowego");
 
          if(containerId){
              const foundContainer = await Container.findById(containerId);
              if(!foundContainer){
                  cb(errorParams, null);
              }
              //conainerFolderName = utils.getFileNameWithNoExt(foundContainer.fileName);
              //finalPath = './repo/'+userId+'/'+projectId+'/'+sessionId+'/' + conainerFolderName;

              const conainerFolderName = utils.getFileNameWithNoExt(oryginalFileName)+"-"+uniqueHash;
              const containerFolderPath = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + conainerFolderName;
              finalPath = containerFolderPath;
              
          } else {
             cb(errorParams, null);
          }
      } else {
          let mimeError = new Error("Nieakceptowalny typ pliku");
          cb(mimeError, null);
      }


      cb(null, finalPath);
  },

  filename: (req, file, cb) => {
      //const uniqueHash = req.body.uniqueHash;
      const uniqueHash = req.uniqueHash;

     // const audioFileName = utils.getFileNameWithNoExt(file.originalname)+"-"+utils.getFileExtention(file.originalname)+"-"+nowyHash;
     const audioFileName = utils.getFileNameWithNoExt(file.originalname)+"-"+uniqueHash+"_temp."+utils.getFileExtention(file.originalname);
      
     cb(null, audioFileName);
  }
  
});



const fileFilterAudio = (req, file, cb) => {
  var type = file.mimetype;
  var typeArray = type.split("/");
  if (typeArray[0] == "audio" ||
      typeArray[0] == "text") {
    cb(null, true);
  } else {
    cb(null, false);
  }
}

let uploadAudio = multer({
  storage: fileStorageAudio,
  fileFilter: fileFilterAudio,
}).single('myFile');

module.exports = uploadAudio;