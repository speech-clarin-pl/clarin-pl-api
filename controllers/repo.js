const fs = require('fs-extra');
const path = require('path');

const mkdirp = require("mkdirp"); //do tworzenia folderu
const rimraf = require("rimraf");
const appRoot = require('app-root-path'); //zwraca roota aplikacji
const moment = require('moment');
const utilsForFiles = require('../utils/utils');
const config = require('../config.js');


//##########################################
//#### upload Plików do repo ######
//#######################################
exports.uploadFiles = (req, res, next) => {
  console.log('Files upload')

  const filesToSave = req.files;
  const folderKey = req.body.folderKey;
  const userId = req.body.userId;
  const projectId = req.body.projectId;

  console.log(filesToSave)
  console.log(folderKey)
  console.log(userId)
  console.log(projectId)

  //musze przenieść plik z plikow tymczasowych do katalogu repo użytkownika
  const finalFileDest = appRoot + '/repo/' + userId + '/' + projectId + '/';


  let listablednychplikow = [];
  let listaplikowOK = [];
  for (let i=0; i< filesToSave.length; i++){
    fs.move(appRoot + '/repo/uploaded_temp/' + filesToSave[i].filename, finalFileDest + folderKey + filesToSave[i].originalname, { overwrite: true }, function (err) {
      if (err) {
          console.log("error in move file")
          console.error(err);
          listablednychplikow.push(filesToSave[i]);
      } else {
        listaplikowOK.push(filesToSave[i]);
      }
    });
  }
  
  if(listablednychplikow.length > 0){
    res.status(500).json({ message: 'At least one file has not been uploaded'});
  } else {
    res.status(200).json({ message: 'files have been uploaded'});
  }

  
  // const repoPath = appRoot + "/repo/" + userId + "/" + projectId;

  // fs.mkdirs(repoPath + '/' + key, function (err) {
  //   if (err) {
  //     res.status(500).json({ message: 'Problem with folder creation!', key: key });
  //     return console.error(err);
  //   }

  //   res.status(201).json({ message: 'Folder has been created!', key: key });
  // });

}

//##########################################
//#### tworze folder ######
//#######################################
exports.createFolder = (req, res, next) => {
  console.log('createFolder')

  const key = req.body.key; //np key: "nowyfolder/" lub "nowyfolder/innypodfolder/"
  const userId = req.body.userId;
  const projectId = req.body.projectId;

  const repoPath = appRoot + "/repo/" + userId + "/" + projectId;

  fs.mkdirs(repoPath + '/' + key, function (err) {

    if (err) {
      res.status(500).json({ message: 'Problem with folder creation!', key: key });
      return console.error(err);
    }

    res.status(201).json({ message: 'Folder has been created!', key: key });
  });

}

//##########################################
//#### zmieniam nazwe folderu ######
//#######################################
exports.renameFolder = (req, res, next) => {
  console.log('renameFolder')
  const oldKey = req.body.oldKey; //stara nazwa
  const newKey = req.body.newKey; //nowa nazwa
  const projectId = req.body.projectId;
  const userId = req.body.userId;

  const repoPath = appRoot + "/repo/" + userId + "/" + projectId;

  fs.renameSync(repoPath + '/' + oldKey, repoPath + '/' + newKey, function (err) {
    if (err) console.log('ERROR: ' + err);
  });

  res.status(200).json({ message: 'Folder has been renamed!', oldKey: oldKey, newKey: newKey });
}

//##########################################
//#### przenosze folder ######
//#######################################
// exports.moveFolder = (req, res, next) => {

//   res.status(200).json({message: 'Folder has been moved!'});
// }

//##########################################
//#### usuwam folder ######
//#######################################
exports.deleteFolder = (req, res, next) => {
  console.log('deleteFolder')
  const folderKey = req.body.folderKey;
  const projectId = req.body.projectId;
  const userId = req.body.userId;

  const repoPath = appRoot + "/repo/" + userId + "/" + projectId;

  rimraf(repoPath + '/' + folderKey, function (err) {
      if (err) throw err;
      // if no error, file has been deleted successfully
      console.log('Folder deleted!');
      res.status(200).json({ message: 'Folder has been removed!', folderKey: folderKey });
    });

}

//##########################################
// #### usuwam plik z repo uzytkownika ######
//#######################################
exports.deleteFile = (req, res, next) => {
  console.log('deleteFile');

  const fileKey = req.body.fileKey;
  const projectId = req.body.projectId;
  const userId = req.body.userId;

  const repoPath = appRoot + "/repo/" + userId + "/" + projectId;

  fs.unlink(repoPath + '/' + fileKey, function (err) {
    if (err) throw err;
    // if no error, file has been deleted successfully
    console.log('File deleted!');
    res.status(200).json({ message: 'File has been removed!', fileKey: fileKey });
  });
}

//##########################################
//#### file download ######
//#######################################
exports.downloadFile = (req,res,next) => {
  const userId = req.query.userId;
  const projectId = req.query.projectId;
  const fileKey = req.query.fileKey;

  const pathToDownload = config.publicApiAddress + '/'+userId + "/" + projectId + fileKey;

  console.log('DOWNLOAD FILE');
  console.log(pathToDownload)

  //res.download(pathToDownload);
  res.status(200).json({pathToDownload: pathToDownload, message: 'you can download the file'});

}

//##########################################
//#### update zawartości pliku txt ######
//#######################################
exports.editTxtFile = (req, res, next) => {

  console.log('editTxtFile')

  const fileKey = req.body.key;
  const newContent = req.body.newContent;
  const userId = req.body.userId;
  const projectId = req.body.projectId;

  const repoPath = appRoot + "/repo/" + userId + "/" + projectId;

  fs.writeFile(repoPath + "/" + fileKey, newContent, (err) => {
    // throws an error, you could also catch it here
    if (err) throw err;

    // success case, the file was saved
    res.status(200).json({ message: 'File has been updated!', key: fileKey });
  });


 
}

//##########################################
//#### zmieniam nazwe pliku ######
//#######################################
exports.renameFile = (req, res, next) => {

  console.log('renameFile')

  const oldKey = req.body.oldKey;
  const newKey = req.body.newKey;
  const projectId = req.body.projectId;
  const userId = req.body.userId;

  const repoPath = appRoot + "/repo/" + userId + "/" + projectId;

  fs.renameSync(repoPath + '/' + oldKey, repoPath + '/' + newKey, function (err) {
    if (err) console.log('ERROR: ' + err);
  });

  res.status(200).json({ message: 'File has been renamed!', oldKey: oldKey, newKey: newKey });
}

//##########################################
// #### przenosze plik w inne miejsce ######
//#######################################
// exports.moveFile = (req, res, next) => {

//   res.status(200).json({message: 'File has been moved!'});
// }



//##############################################
// POBIERAM LISTE PLIKOW DANEGO UZYTKOWNIKA W JEGO FOLDERZE
//###############################################
exports.getRepoFiles = (req, res, next) => {
  console.log('GET REPO FILES');

  const userId = req.userId;
  const projectId = req.query.projectId;

  //console.log(userId);
  //console.log(projectId);

  //tymczasowo symulacja damych
  //one mjusza byc dynamicznie z node generowane
  //  const files = [
  //     {
  //       key: 'cat in a hat.mp3',
  //       modified: +moment().subtract(1, 'hours'),
  //       size: 1.5 * 1024 * 1024,
  //     },
  //     {
  //       key: 'photos/animals/kitten_ball.png',
  //       modified: +moment().subtract(3, 'days'),
  //       size: 545 * 1024,
  //     }
  //   ];

  //sciezka do plikow danego usera i danego projektu
  const repoPath = appRoot + "/repo/" + userId + "/" + projectId;

  const repoStatic = userId + "/" + projectId;

  utilsForFiles.readDir(repoPath, function (filePaths) {
    //sciezki zawieraja pewne sciezki wiec je przeksztalcam na relatywne
    const userfiles = filePaths.map(path => {
      const relativePath = path.replace(repoPath, '');

      //const fileModified =  +moment().subtract(15, 'days');
      const fileModified = +moment(fs.statSync(path).mtime);

      //const fileSize = 4.2 * 1024 * 1024;
      const fileSize = fs.statSync(path).size;
      
      //const urltopass = config.publicApiAddress + path.replace(appRoot, '');
      
      const urltopass = config.publicApiAddress + '/' + repoStatic + relativePath;

      console.log(urltopass)
      console.log(path)
      console.log(relativePath)
      console.log(appRoot)

      //const urltopass = config.publicApiAddress + path.replace(appRoot, '');
      
      let fileEntry = {
        key: relativePath,
        modified: fileModified,
        size: fileSize,
        url: urltopass
      }
      return fileEntry;
    })
    res.status(200).json({ message: 'Files for this project and user featched!', files: userfiles })
  });
}