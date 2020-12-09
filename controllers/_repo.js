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
const Session = require('../models/Session');


//#############################
//####### upload wielu plików audio ##########
//################################

exports.uploadAudio = (req,res,next) => {

  var form = new IncomingForm();

  form.on('file', (field, file) => {
    // Do something with the file
    // e.g. save it to the database
    // you can access it using file.path
  })

  form.on('end', () => {
    res.json()
  })

  form.parse(req)

  
}

//##########################################
//#### upload Plików do repo ######
//#######################################

exports.uploadFiles = (req, res, next) => {
  console.log('Files upload')

  const filesToSave = req.files;
  const folderKey = req.body.folderKey;
  const userId = req.body.userId;
  const projectId = req.body.projectId;

  //musze przenieść plik z plikow tymczasowych do katalogu repo użytkownika
  const finalFileDest = appRoot + '/repo/' + userId + '/' + projectId + '/';

  let listablednychplikow = [];
  let listaplikowOK = [];
  let filesToSaveInDB = [];

  ProjectEntry.findById(projectId)
    .then(foundPD => {

      for (let i = 0; i < filesToSave.length; i++) {

        let oryginalName = filesToSave[i].originalname;

        //sprawdzam czy plik o takiej samej nazwie nie istnieje już w w tym samym katalogu w bazie
        //jezeli istnieje to dodaje prefix _(copy)
        for (let s = 0; s < foundPD.files.length; s++) {
          let f = foundPD.files[s];
          if ((folderKey + f.name) == (folderKey + oryginalName)) {
            oryginalName = utils.addSuffixToFileName(oryginalName, '_(copy)');
            break;
          }
        }

        const fullFinalFilePath = finalFileDest + folderKey + oryginalName;

        //przenosze wgrane pliki z folderu temp do repo uzytkownika
        fs.move(appRoot + '/repo/uploaded_temp/' + filesToSave[i].filename, fullFinalFilePath, { overwrite: false })
          .then(() => {
            // console.log("grupuje pliki do wstawienia do bazy");
            const plik = new ProjectFile({
              name: oryginalName,
              fileKey: folderKey + oryginalName,
              fileSize: fs.statSync(fullFinalFilePath).size,
              fileModified: +moment(fs.statSync(fullFinalFilePath).mtime),
              connectedWithFiles: []
            });
            foundPD.files.push(plik);

            //po ostatnim pliku w kolejce zapisuje entry do bazy
            //bo juz wszystkie pliki sa zupdatowane
            if (i == filesToSave.length - 1) {

              ProjectEntry.updateOne({ "_id": projectId }, { "files": foundPD.files })
                .then(updatedPE => {
                  console.log("pdatedPD")
                  console.log(updatedPE);
                  res.status(200).json({ message: 'files have been uploaded' });
                })
                .catch(err => {
                  console.error(err);
                  return err;
                })
            }

          })
          .catch(() => {
            console.error(err);
            return err;
          })
      }

    })

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

    //zapisuje w bazie nowy folder
    const newFolder = new ProjectFile({
      name: key.substring(key.length - 1),
      fileKey: key,
      fileSize: 0,
      fileModified: 0,
      connectedWithFiles: []
    });

    ProjectEntry.findOneAndUpdate({ "_id": projectId }, { $push: { "files": newFolder } })
      .then(() => {
        res.status(201).json({ message: 'Folder has been created!', key: key });
      })
      .catch((err) => {
        console.log(err)
      })
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

  //zmieniam nazwe tego folderu w bazie danych
  ProjectEntry.findById(projectId)
    .then(foundPE => {

      //sukam w zapisanych plikach edytowany folder 
      //oraz musze zrobic update we wszystkich plikachj które zawieraja 
      //go jako key

      let wszystkiePliki = foundPE.files;
      for (let i = 0; i < wszystkiePliki.length; i++) {
        let plik = wszystkiePliki[i];
        let oldFileKey = plik.fileKey;
        if (oldFileKey.includes(oldKey)) {
          let newFileKey = oldFileKey.replace(oldKey, newKey);
          plik.name = utils.getFileNameFromRepoKey(newFileKey);
          plik.fileKey = newFileKey;
          wszystkiePliki[i] = plik;
        }
      }

      //robie update wszystkich plikow w projekcie
      // do ewentualnego poprawienia w przyszlosci efektywnosc tego rozwiazania
      //aby nie edytowac calej listy tylko te zupdatowane

      ProjectEntry.findOneAndUpdate({ "_id": projectId }, { "files": wszystkiePliki })
        .then(updatedPE => {
          res.status(200).json({ message: 'Folder has been renamed!', oldKey: oldKey, newKey: newKey });
        })
    })
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

    ProjectEntry.findById(projectId)
      .then(foundPE => {
        //usuwam z tabicy wszystkie elementy ktore posiadaja dany folderKey w fileKey
        let wszystkiePliki = foundPE.files;
        let filteredPliki = wszystkiePliki.filter(plik => {
          return !plik.fileKey.includes(folderKey)
        })

        //robie update wszystkich plikow w projekcie
        // do ewentualnego poprawienia w przyszlosci efektywnosc tego rozwiazania
        //aby nie edytowac calej listy tylko te zupdatowane

        ProjectEntry.findOneAndUpdate({ "_id": projectId }, { "files": filteredPliki })
          .then(updatedPE => {
            res.status(200).json({ message: 'Folder has been removed!', folderKey: folderKey });
          })

      })

  })


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
    
    // tutaj trzeba zrobić update tylko jednego wpisu w tablicy files w bazie danych

    ProjectEntry.updateOne({ "_id": projectId}, { $pull: { "files": {"fileKey":fileKey} } })
    .then(()=>{
      res.status(200).json({ message: 'File has been removed!', fileKey: fileKey });
      console.log('File deleted!');
    })
    .catch((err)=>{
      console.log('Can not remove the file from DB');
      console.log(err);
    })
  
   
  });
}

//##########################################
//#### file download ######
//#######################################
exports.downloadFile = (req, res, next) => {
  const userId = req.query.userId;
  const projectId = req.query.projectId;
  const fileKey = req.query.fileKey;

  const pathToDownload = config.publicApiAddress + '/' + userId + "/" + projectId + "/" + fileKey;

  console.log('DOWNLOAD FILE');
  console.log(pathToDownload)

  //res.download(pathToDownload);
  res.status(200).json({ pathToDownload: pathToDownload, message: 'you can download the file' });

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

   //robimy update w bazie danych
   ProjectEntry.findById(projectId)
   .then(foundPE=>{

     let foundfile = foundPE.files.find(file=>{
       return file.fileKey == oldKey;
     })

     foundfile.fileKey = newKey;
     foundfile.name = utils.getFileNameFromRepoKey(newKey);
     console.log(foundfile)


     ProjectEntry.findOneAndUpdate({ "files": { $elemMatch: { "_id": foundfile._id } } }, { "files.$": foundfile })
     .then(foundPE => {
       res.status(200).json({ message: 'File has been renamed!', oldKey: oldKey, newKey: newKey });
     })
   })

  
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
  
  //console.log('GET REPO FILES');

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

        let listOfUserFiles = znalezionyPE.files.map(file => {

          const urltopass = config.publicApiAddress + '/' + repoStatic + '/' + file.fileKey;

          let fileEntry = {
            key: file.fileKey,
            fileId: file._id,
            modified: file.fileModified,
            size: file.fileSize,
            url: urltopass
          }

          return fileEntry;
        });

        res.status(200).json({ message: 'Files for this project and user featched!', files: listOfUserFiles })

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