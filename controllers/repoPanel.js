const fs = require('fs-extra');
const path = require('path');
const ffmpeg = require('ffmpeg');

const mkdirp = require("mkdirp"); //do tworzenia folderu
const rimraf = require("rimraf");
const appRoot = require('app-root-path'); //zwraca roota aplikacji
const moment = require('moment');
const utils = require('../utils/utils');
const config = require('../config.js');
const ProjectEntry = require('../models/projectEntry');
const Container = require('../models/Container')
const Session = require('../models/Session');
const ProjectFile = require('../models/projectFile');
const User = require('../models/user');
const IncomingForm = require('formidable').IncomingForm;
const uniqueFilename = require('unique-filename');
const shell = require('shelljs');

const runTask = require('./runTask');


// ###################################################
// ########### pobieram plik z repozytorium użytkownika
// ######################################################

//'/:userId/:projectId/:sessionId/:containerId/:fileType'
exports.getFileFromContainer = (req,res,next) => {
  const userId = req.params.userId;
  const projectId = req.params.projectId;
  const sessionId = req.params.sessionId;
  const containerId = req.params.containerId;
  
  const fileType = req.params.fileType;

  //pobieram kontener z bazy danych
  Container.findById(containerId)
    .then(container => {

        //sciezka do pliku dat
        const repoPath = appRoot + "/repo/" + userId + "/" + projectId + "/" + sessionId;

        const containerFolderName = utils.getFileNameWithNoExt(container.fileName);
        const fileAudioName = container.fileName;
        const fileDatName = utils.getFileNameWithNoExt(container.fileName)+".dat";

        //sprawdzam o jaki typ pliku mi chodzi: dat, json czy mp3: TO DO
        let filePath = null;

        if(fileType=='audio'){
           filePath = repoPath + "/" + containerFolderName + "/" + fileAudioName;
        } else if(fileType=='dat'){
           filePath = repoPath + "/" + containerFolderName + "/" + fileDatName;
        }

       

        //res.status(200).({ message: 'The data for previewing has been sent!', containerData: filePath});
        
       // res.sendFile(filePath);

        //res.set('Content-Type', 'application/json');
       // res.status(200).json({toolType: toolType});
       // res.append("toolType", toolType);
       // fs.createReadStream(filePath).pipe(res);
        res.sendFile(filePath);
    })
}


//##########################################
//#### robie update flagi containera ######
//#######################################
exports.runSpeechService = (req, res, next) => {

  const containerId = req.body.containerId;
  const toolType = req.body.toolType;

  // tutaj odpalam odpowiednia usługę

  Container.findById(containerId).then(container => {  

    const userId = container.owner;
    const projectId = container.project;
    const sessionId = container.session;

    const containerName = container.containerName;  //np. lektor  - to co widzi użytkownik w repo
    const audioFileName = container.fileName;       //np. lektor-fe2e3423.wav - na serwerze
    const containerFolderName = utils.getFileNameWithNoExt(audioFileName);  //np.lektor-fe2e3423 - na serwerze folder

    let inputAudioFilePath = '';
    let inputTxtFilePath = '';

    let outputFilePath = '';

    let fieldToUpdate = ""; //pole w modelu kontenera do zamiany na true

    let outputFileName = "";

    switch(toolType){
      case "DIA":
         fieldToUpdate = {ifDIA: true};
          console.log("Uruchamiam usługę DIA");
          break;
      case "VAD":
        fieldToUpdate = {ifVAD: true};
        console.log("Uruchamiam usługę VAD");
          break;
      case "RECO":

        fieldToUpdate = {ifREC: true};
      
        const userId = container.owner;
        const projectId = container.project;
        const sessionId = container.session;
    
        const containerName = container.containerName;  //np. lektor  - to co widzi użytkownik w repo
        const audioFileName = container.fileName;       //np. lektor-fe2e3423.wav - na serwerze
        const containerFolderName = utils.getFileNameWithNoExt(audioFileName);  //np.lektor-fe2e3423 - na serwerze folder

       let outFileName = containerFolderName + ".json";

       outputFilePath = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + containerFolderName + '/' + outFileName;
       inputAudioFilePath = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + containerFolderName + '/' + audioFileName;

       //do dockera podaje ścieżke relatywną
       inputAudioFilePath = path.relative(appRoot + '/repo/', inputAudioFilePath);

        runTask.runRECO(inputAudioFilePath, outputFilePath, container._id)
          .then(updatedContainer => {
            //console.log(updatedContainer)
            res.status(200).json({ message: 'The service for this container has finished working with success!!', containerId: updatedContainer._id, toolType: toolType});
          }).catch(error => {
            console.log('ERROR Z TASKIEM')
            console.log(error)
          })


        break;
      case "ALIGN":
        fieldToUpdate = {ifSEG: true};
        console.log("Uruchamiam usługę ALIGN");
          break;
      default:
          console.log("Default"); //to do
    }

  }).catch(err => {
    console.log("Error: container not found")
  })

}


//##########################################
//#### usuwanie pojedynczego kontenera z repo ######
//#######################################

exports.removeContainer = (req,res,next) => {

  const userId = req.params.userId;
  const projectId = req.params.projectId;
  const sessionId = req.params.sessionId;
  const containerId = req.params.containerId;

  // tutaj usuwanie z repo, bazy danych, audio i txt

  const conainerFolder = utils.getFileNameWithNoExt(container.fileName);

  const containerPath = appRoot + "/repo/" + userId + "/" + projectId + "/" + sessionId + "/" + conainerFolder;

  Container.findById(containerId)
    .then(foundContainer => {

        //usuwam folder kontenera z dysku fizycznie
        fs.rmdir(containerPath,{recursive: true}, function (err) {
          if (err) throw err;

          //usuwam wpis w kolekcji Containers
          Container.findByIdAndRemove(containerId)
          .then(removedContainer => {
            
              //usuwam odniesienie w kolekcji Sessions
              Session.findByIdAndUpdate(sessionId,{$pull: {containersIds: containerId}})
              .then(updatedSession =>{
                res.status(200).json({ message: 'The container has been removed!', sessionId: sessionId, containerId: containerId});
              })
              .catch(error => {
                res.status(500).json({ message: 'Something went wrong with removing the container!', sessionId: sessionId, containerId: containerId});
                console.log(error);
                throw error;
              })
          })
          .catch(error => {
            res.status(500).json({ message: 'Something went wrong with removing the container!', sessionId: sessionId, containerId: containerId});
            console.log(error);
            throw error;
          })
        });
    })
}


//##########################################
//#### upload pojedynczego pliku do repo ######
//#######################################

exports.uploadFile = (req, res, next) => {

  const savedFile = req.file.filename; // już z unikatowym id
  const oryginalFileName = req.file.originalname; //nazwa oryginalnego pliku

  const userId = req.body.userId;
  const projectId = req.body.projectId;
  const sessionId = req.body.sessionId;

  const uniqueHash = req.body.uniqueHash;

  const nowyHash = uniqueFilename("","",uniqueHash);

  let fileWithNoExt = utils.getFileNameWithNoExt(savedFile);
  let fileWithNoSufix = fileWithNoExt.substring(0, fileWithNoExt.length - 5);

  const conainerFolderName = fileWithNoSufix;
  //const conainerFolderName = savedFile+"-"+nowyHash;
  const containerFolderPath = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + conainerFolderName;

  const fullFilePath = containerFolderPath + "/" + savedFile;

  // ROBIE KONWERSJE FFMPEG

  try {

      let process = new ffmpeg(fullFilePath);
      process.then(audio => {
        audio.setAudioFrequency(16000)
              .setAudioChannels(1)
              .setAudioBitRate(256);

        audio.addCommand('-y', '');
        audio.addCommand('-sample_fmt', 's16');

        //teraz robie konwersje na WAV i usuwam sufix _temp w docelowym pliku
        // musze tak robic bo zapisywanie w miejscu nie dziala przy dlugich plikach....

        const finalAudioFileName = conainerFolderName + ".wav";
        const fillCorrectAudioPath = containerFolderPath + "/" + finalAudioFileName;

        //tworze odpowiednia nazwe kontenera - bez unikatowego ID oraz bez rozszerzenia
        const finalContainerName = oryginalFileName

        audio.save(fillCorrectAudioPath)
              .then(convertedFile=>{
                //console.log('SUCCESS: przekonwertowałem plik' + convertedFile)
                //teraz moge usunąć oryginalny plik z dysku bo mam już przekonwertowany
                fs.remove(fullFilePath)
                .then(() => {
                    //console.log('Oryginalny plik został usunięty - pozostawiony tylko poprawnie przekonwertowany')

                    //zapisuje tą informaje do DB
                    let newContainer = new Container({
                      fileName: finalAudioFileName,
                      containerName: utils.getFileNameWithNoExt(oryginalFileName),
                      size: fs.statSync(fillCorrectAudioPath).size,
                      owner: userId,
                      project: projectId,
                      session: sessionId,
                      ifVAD: false,
                      ifDIA: false,
                      ifREC: false,
                      ifSEG: false,
                      statusVAD: 'ready',
                      statusDIA: 'ready',
                      statusREC: 'ready',
                      statusSEG: 'ready',
                    });

                    let ext = utils.getFileExtention(finalAudioFileName);
                    ext = (ext[0]+'').toLowerCase();

                    const finalDATFileName = conainerFolderName + ".dat";
                    const fillCorrectDATPath = containerFolderPath + "/" + finalDATFileName;

                    const shellcomm = 'audiowaveform -i '+fillCorrectAudioPath+' -o '+fillCorrectDATPath+' -z 128 -b 8 --input-format ' + ext;

                      //obliczam z pliku audio podgląd dat
                    if (shell.exec(shellcomm).code !== 0) {
                      shell.echo('Error: Problem with extracting dat for audio file');
                      shell.exit(1);
                    } else {
                      newContainer.save()
                      .then(createdContainer => {

                        //updating the reference in given session
                        Session.findOneAndUpdate({_id: sessionId},{$push: {containersIds: createdContainer._id }})
                          .then(updatedSession => {
                            res.status(200).json({ message: 'New file has been uploaded!', sessionId: sessionId, oryginalName: oryginalFileName, containerId: createdContainer._id})
                          })

                      })
                      .catch(error => {
                        throw error;
                      })
                    }


                })
                .catch(err => {
                  console.error('Problem z usunietceim pliku gdy istnieje już poprawnie przekonwertowany' + err)
                })

              }).catch(err =>{
                console.log('ERROR SAVE FFMPEG: coś poszło nie tak')
              })
      }).catch(err=>{
        console.log('Error FFMPEG: ' + err)
      })

    /*
        const shellcomm = 'ffmpeg -i ' + fullFilePath + ' -ar 16000 -sample_fmt s16 -ac 1 -y ' + utils.getFileNameWithNoExt(fullFilePath) + '.wav';

        //obliczam z pliku audio podgląd dat
      if (shell.exec(shellcomm).code !== 0) {
        shell.echo('Error: Problem with FFMPG');
        shell.exit(1);
      } else {

      }

      */

        

  } catch (e) {
    console.log("ups!! jakis wyjatek...")
    console.log(e.code);
	  console.log(e.msg);
  }
  
/*
  let newContainer = new Container({
    fileName: savedFile,
    containerName: oryginalFileName,
    size: fs.statSync(fullFilePath).size,
    owner: userId,
    project: projectId,
    session: sessionId,
    ifVAD: false,
    ifDIA: false,
    ifREC: false,
    ifSEG: false,
  });


  let ext = utils.getFileExtention(oryginalFileName);
  ext = (ext[0]+'').toLowerCase();

  const shellcomm = 'audiowaveform -i '+fullFilePath+' -o '+fullFilePath+'.dat -z 128 -b 8 --input-format ' + ext;

    //obliczam z pliku audio podgląd dat
  if (shell.exec(shellcomm).code !== 0) {
    shell.echo('Error: Problem with extracting dat for audio file');
    shell.exit(1);
  } else {
    newContainer.save()
    .then(createdContainer => {

      //updating the reference in given session
      Session.findOneAndUpdate({_id: sessionId},{$push: {containersIds: createdContainer._id }})
        .then(updatedSession => {
          res.status(200).json({ message: 'New file has been uploaded!', sessionId: sessionId, oryginalName: oryginalFileName, containerId: createdContainer._id})
        })

    })
    .catch(error => {
      throw error;
    })
  }

  */

}

//##########################################
//#### tworzenie nowej sesji ######
//#######################################

exports.createNewSession = (req, res, next) => {

    const sessionName = req.body.sessionName;
    const projectId = req.body.projectId;
    const userId = req.body.userId;

    let session = new Session({
      name: sessionName,
      projectId: projectId,
    });


    //zapisuje sesje w DB
    session.save()
      .then(createdSession => {

        //odnajduje projet w DB i dodaje id tej sesji do niego
        ProjectEntry.findByIdAndUpdate(projectId,{$push: {sessionIds: createdSession._id}})
          .then(updatedProject=> {

            //tworze folder na dysku dla tej sesji
            const repoPath = appRoot + "/repo/" + userId + "/" + projectId;
    
            fs.mkdirs(repoPath + '/' + createdSession._id, function (err) {
        
              if (err) {
                res.status(500).json({ message: 'Problem with session creation!'});
                return console.error(err);
              }
          
              res.status(200).json({ message: 'New session has been created!', sessionName: createdSession.name, id: createdSession._id})
              
            });           
          })
          .catch(error => {
            throw error;
          })
      })
      .catch(error => {
        throw error;
      })
}


//#######################################################
//################ pobieram assety użytkownika ##########
//#########################################################

exports.getRepoAssets = (req,res,next) => {

  //wydobywam dane z urla
  const userId = req.params.userId;
  const projectId = req.params.projectId;

  //szukam plików w bazie danych dla danego usera
  let znalezionyProjekt = null;
  ProjectEntry.findById(projectId)
    .then(foundPE => {
      znalezionyProjekt = foundPE;
      return User.findById(userId);
    })
    .then(user => {

      if (user._id == userId) {

        //wydobywam liste sesji
        let sessionIds = znalezionyProjekt.sessionIds;

        let sessionList = [];
        let containerList = [];

        Session.find({_id: sessionIds})
          .then(listaSesji => {
            sessionList = listaSesji;

            sessionList = listaSesji.map(sesja => {
              return({
                id: sesja._id,
                sessionName: sesja.name,
                ifSelected: false,
                containers: sesja.containersIds,
              });
            })
            return sessionList;
          })
          .then(listaSesji => {

            Container.find({owner: userId, project: projectId})
              .then(containers=>{

                containerList = containers;

                res.status(200).json({ message: 'Files for this project and user featched!', sessions: sessionList, containers: containerList })
              })
          })
          .catch(error => {
            console.log(error);
            throw error;
          })

      } else {
        let error = new Error('Not authorized access');
        error.statusCode = 401;
        throw error;
      }
    })
    .catch(err => {
      let error = new Error('Error with loading project repo assets');
      error.statusCode = 500;
      throw error;
    })
}

