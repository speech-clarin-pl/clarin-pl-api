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
const {spawn} = require('child_process');
const chalk = require('chalk');

//const AdmZip = require('adm-zip');

const emu = require('./emu');

const runTask = require('./runTask');

const archiver = require('archiver');


//##########################################
//#### Eksportuje do emu ######
//#######################################

exports.zipDirectory = (source, out) => {
  const archive = archiver('zip', { zlib: { level: 9 }});
  const stream = fs.createWriteStream(out);

  return new Promise((resolve, reject) => {
    archive
      .directory(source, false)
      .on('error', err => reject(err))
      .pipe(stream)
    ;

    stream.on('close', () => resolve());
    archive.finalize();
  });
}


exports.createKorpus = (projectId, userId) => {
  return new Promise((resolve, reject) => {
  

    // creating archives
   // var zip = new AdmZip();
  
    // tutaj robie export do EMU tylko tych plików które mają wszystkie narzędzia wykonane
  
    //przeglądam kontenery tego użytkownika i wybieram tylko te które mogą być zapisane
    Container.find({owner: userId, project: projectId, ifVAD: true, ifDIA: true, ifREC: true, ifSEG: true },{VADUserSegments:0, DIAUserSegments:0,RECUserSegments:0,SEGUserSegments:0})
      .then(containers => {

        const nazwaKorpusu = 'KORPUS';
        const pathToUserProject = appRoot + '/repo/' + userId + '/' + projectId;
        const pathToCorpus = pathToUserProject + '/' + nazwaKorpusu;
        const pathToZIP = pathToCorpus+'.zip';
  
        emu.containers2EMU(containers)
          .then(correctContainers=>{
  
            console.log("Folder do CORPUSU: " +  pathToCorpus);
  
            //teraz tworze folder w katalogu projektu danego usera z gotowym korpusem
            if(!fs.existsSync(pathToCorpus)){
              fs.mkdirSync(pathToCorpus, { recursive: true })
            } 
  
  
            let oryginalDBconfigPath = appRoot + '/emu/test_DBconfig.json';
            let pathToDBconfig = pathToCorpus + '/' + nazwaKorpusu + '_DBconfig.json';
            //teraz kopiuje do niego plik DBconfig.json
            //zamieniam parametr name na nazwe korpusu
  
            const dbconfig = fs.readJsonSync(oryginalDBconfigPath);
  
            dbconfig.name = nazwaKorpusu;
  
            fs.writeJsonSync(pathToDBconfig, dbconfig,{spaces: '\t'});
            //fs.copySync(oryginalDBconfigPath, pathToDBconfig);

            let promises = [];
           
            //teraz tworze w tym folderze katalogi z sesjami i kopiuje tam foldery z contenerami
            for (let container of correctContainers){
              const audioFileName = container.fileName;
              const containerFolderName = utils.getFileNameWithNoExt(audioFileName);  //np.lektor-fe2e3423 - na serwerze folder
              const projectId = container.project;
              const sessionId = container.session;
              const pathToContainer = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + containerFolderName;
              
              let promis = new Promise((resolve, reject) => {
                Session.findById(sessionId)
                .then(session=>{
  
                  const sessionName = session.name;
                  const sessionPath = pathToCorpus + '/' + sessionName + '_ses';
  
                  console.log("tworze sesje: " + sessionPath)
                  //tworze katalog sesji jeżeli nie istnieje
                  if(!fs.ensureDirSync(sessionPath)){
                    console.log("stworzyłem sesje: " + sessionPath)
                    fs.mkdirSync(sessionPath, { recursive: true })
                  } 
  
  
                  const containerPath = sessionPath + '/' + containerFolderName + '_bndl';
                  //tworze katalog contenera jeżeli nie istnieje
                  if(!fs.ensureDirSync(containerPath)){
                    console.log("stworzyłem container folder: " + containerPath)
                    fs.mkdirSync(containerPath, { recursive: true })
                  } 
  
                  //kopiuje do niego pliki EMU json oraz wav
  
                  let srcpathToWAV = pathToContainer + '/' + audioFileName;
                  let destpathToWAV = containerPath + '/' + audioFileName;
  
                  let srcpathToEMUjson = pathToContainer + '/' + containerFolderName + '_annot.json';
                  let destpathToEMUjson = containerPath + '/' + containerFolderName + '_annot.json';
  
                  try{
                    fs.copySync(srcpathToWAV, destpathToWAV);
                    fs.copySync(srcpathToEMUjson, destpathToEMUjson);
                    resolve();
                  } catch(error) {
                    reject();
                  }

  
                }).catch(error=>{
                  console.error(error)
                })
              });


              promises.push(promis);
              
  
            }


            Promise.all(promises)
            .then(result => {
                  this.zipDirectory(pathToCorpus,pathToZIP)
                  .then(()=>{
                    fs.removeSync(pathToCorpus);
                    resolve(pathToZIP);
                  })
                  .catch((error)=>{
                    reject(error);
                  })
            })
            .catch(err=>{
              resolve(pathToZIP);
            })

          

             // add local file
            //zip.addLocalFolder(pathToCorpus);

           // zip.writeZip(pathToZIP)
            //  .then(result=>{
            //    fs.removeSync(pathToCorpus);
            //    resolve(pathToZIP);
            //  })
            //  .catch(error=>{
            //    reject(error);
            //  })
          })
          .catch(error=>{   
            console.error(error)
            
            reject(error);
          })     
      })
  
  
  })
}


exports.exportToEmu = (req, res, next) => {
  const projectId = req.params.projectId;
  const userId = req.params.userId;

  this.createKorpus(projectId, userId)
    .then((pathToZIP)=>{
      console.log("ZIP stworzony: " + pathToZIP)
     // res.sendFile(pathToZIP)
     // res.download(pathToZIP, 'readyZIP.zip');
      res.status(200).json({ message: 'Korpus has been created! you can download it'});
      //res.status(200).json({ message: 'ZIP created successfuly!'});
    })
    .catch((error)=>{
      res.status(204).json({ message: 'You have not created all annotation levels or something went wrong in the server!'});
    }) 
}

//##########################################
//#### zmieniam nazwe contenera ######
//#######################################

exports.changeContainerName = (req, res, next) => {
  const projectId = req.params.projectId;
  const containerId = req.params.containerId;
  const newName = req.body.newName;

  //console.log("ZMIENIAM NAZWE NA " + newName);

  Container.findByIdAndUpdate(containerId,{containerName: newName}).then(container => {
    res.status(200).json({containerId: container._id})
  }).catch(error =>{
    console.log(chalk.red("Something went wrong with the update of the container name"))
    res.status(500).json({message: 'Something went wrong with the update of the container name'})
  })

  

}


//##########################################
//#### wykonuje VAD ######
//#######################################
exports.runSpeechVAD = (req, res, next) => {

  const containerId = req.body.containerId;
  const toolType = req.body.toolType;

  // tutaj odpalam odpowiednia usługę
  //asdlfkajds

  Container.findById(containerId).then(container => {  
    runTask.runVAD(container)
      .then(VADsegments => {
        res.status(200).json({ message: 'The service for this container has finished working with success!!', containerId: containerId, toolType: toolType, VADSegments: VADsegments});
      }).catch(error => {

        //jeżeli coś poszło nie tak to aktualizuje to w bazie
        
        // wystapil blad wiec wpisuje ta wiadomosc
        res.status(503).json({ message: 'Something wrong with the VAD on the server!', containerId: containerId, toolType: toolType});
        console.log(chalk.red('ERROR Z TASKIEM'))
        console.log(chalk.red(error))
      })
  }).catch(err => {
    console.log(chalk.red("Error: container not found"))
  })
}

//##########################################
//#### wykonuje Diaryzacje ######
//#######################################
exports.runSpeechDiarization = (req, res, next) => {

  const containerId = req.body.containerId;
  const toolType = req.body.toolType;

  Container.findById(containerId).then(container => {  
    runTask.runDIA(container)
      .then(DIAsegments => {
        res.status(200).json({ message: 'The service for this container has finished working with success!!', containerId: containerId, toolType: toolType,  DIAsegments: DIAsegments});
      }).catch(error => {
        res.status(503).json({ message: 'Something wrong with the Diarization on the server!!', containerId: containerId, toolType: toolType});
        console.log(chalk.red('ERROR Z TASKIEM'))
        console.log(error)
      })
  }).catch(err => {
    console.log(chalk.red("Error: container not found"))
  })


}

//##########################################
//#### wykonuje segmentacje ######
//#######################################
exports.runSpeechSegmentation = (req, res, next) => {

  const containerId = req.body.containerId;
  const toolType = req.body.toolType;

  Container.findById(containerId).then(container => {  
    runTask.runSEG(container)
      .then(updatedContainer => {
        res.status(200).json({ message: 'The service for this container has finished working with success!!', containerId: updatedContainer._id, toolType: toolType});
      }).catch(errorMessage => {
        //console.log("EEEEEEEEE")
        console.log(errorMessage)
        res.status(503).json({ message: errorMessage, containerId: containerId, toolType: toolType});
        console.log('ERROR Z TASKIEM')
        console.log(errorMessage)
      })
  }).catch(err => {
    console.log("Error: container not found")
  })


}



//##########################################
//#### wykonuje rozpoznawanie mowy ######
//#######################################
exports.runSpeechRecognition = (req, res, next) => {

  const containerId = req.body.containerId;
  const toolType = req.body.toolType;

  console.log(chalk.cyan("uruchamiam runSpeechRecognition"))

  // tutaj odpalam odpowiednia usługę

  Container.findById(containerId).then(container => {  
    console.log(chalk.cyan("znalazłem container"))
    runTask.runREC(container)
      .then(updatedContainer => {
        res.status(200).json({ message: 'The service for this container has finished working with success!!', containerId: updatedContainer._id, toolType: toolType});
      }).catch(error => {
        res.status(503).json({ message: 'Something wrong with the Recognition on the server!!', containerId: updatedContainer._id, toolType: toolType});
        console.log('ERROR Z TASKIEM')
        console.log(error)
      })
  }).catch(err => {
    console.log("Error: container not found")
  })
}


// ###################################################
// ########### pobieram gotowy korpus
// ######################################################


exports.getReadyKorpus = (req,res,next) => {

 const userId = req.params.userId;
 const projectId = req.params.projectId;
 

  const nazwaKorpusu = 'KORPUS';
  const pathToUserProject = appRoot + '/repo/' + userId + '/' + projectId;
  const pathToCorpus = pathToUserProject + '/' + nazwaKorpusu;
  const pathToZIP = pathToCorpus+'.zip';
  
  res.download(pathToZIP,(nazwaKorpusu+'.zip'));

}






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

        let filename = '';

        //sprawdzam o jaki typ pliku mi chodzi
        let filePath = '';

        switch(fileType){
          case "audio": //audio w 16000Hz 16bit...
            filePath = repoPath + "/" + containerFolderName + "/" + fileAudioName;
            filename = fileAudioName;
            break;
          case "dat": //audiowaveform dat
            filePath = repoPath + "/" + containerFolderName + "/" + fileDatName;
            filename = fileDatName;
            break;
          case "oryginalAudio": //audio as it was uploaded
            const oryginalAudioName = container.oryginalFileName;
            filePath = repoPath + "/" + containerFolderName + "/" + oryginalAudioName;
            filename = oryginalAudioName;
            break;
          case "DIActm": 
            const DIActmFile = utils.getFileNameWithNoExt(container.fileName)+"_DIA.ctm";
            filePath = repoPath + "/" + containerFolderName + "/" + DIActmFile;
            filename = DIActmFile;
            break;
          case "DIAtextGrid": 
            const DIAtextGrid = utils.getFileNameWithNoExt(container.fileName)+"_DIA.textGrid";
            filePath = repoPath + "/" + containerFolderName + "/" + DIAtextGrid;
            filename = DIAtextGrid;
            break;
          case "DIAJSON": 
            const DIAJSON = utils.getFileNameWithNoExt(container.fileName)+"_DIA.json";
            filePath = repoPath + "/" + containerFolderName + "/" + DIAJSON;
            filename = DIAJSON;
            break;
          case "VADctm": 
            const VADctmFile = utils.getFileNameWithNoExt(container.fileName)+"_VAD.ctm";
            filePath = repoPath + "/" + containerFolderName + "/" + VADctmFile;
            filename = VADctmFile;
            break;
          case "VADtextGrid": 
            const VADtextGrid = utils.getFileNameWithNoExt(container.fileName)+"_VAD.textGrid";
            filePath = repoPath + "/" + containerFolderName + "/" + VADtextGrid;
            filename = VADtextGrid;
            break;
          case "SEGctm": 
            const SEGctmFile = utils.getFileNameWithNoExt(container.fileName)+"_SEG.ctm";
            filePath = repoPath + "/" + containerFolderName + "/" + SEGctmFile;
            filename = SEGctmFile;
            break;
          case "SEGtextGrid": 
            const SEGtextGrid = utils.getFileNameWithNoExt(container.fileName)+"_SEG.textGrid";
            filePath = repoPath + "/" + containerFolderName + "/" + SEGtextGrid;
            filename = SEGtextGrid;
            break;
          case "VADJSON": 
            const VADJSON = utils.getFileNameWithNoExt(container.fileName)+"_VAD.json";
            filePath = repoPath + "/" + containerFolderName + "/" + VADJSON;
            filename = VADJSON;
            break;
          case "JSONTranscript": 
            const JSONTranscript = utils.getFileNameWithNoExt(container.fileName)+".json";
            filePath = repoPath + "/" + containerFolderName + "/" + JSONTranscript;
            filename = JSONTranscript;
            break;
          case "TXTTranscript": 
            const TXTTranscript = utils.getFileNameWithNoExt(container.fileName)+"_TXT.txt";
            filePath = repoPath + "/" + containerFolderName + "/" + TXTTranscript;
            filename = TXTTranscript;
            break;
          case "EMUJSON": 
            const EMUJSON = utils.getFileNameWithNoExt(container.fileName)+"_annot.json";
            filePath = repoPath + "/" + containerFolderName + "/" + EMUJSON;
            filename = EMUJSON;
            break;
          default:
            filePath = '';
            filename = 'default';
            console.log("wrong file type!!")

        }


 

        //res.status(200).({ message: 'The data for previewing has been sent!', containerData: filePath});
        
       // res.sendFile(filePath);

        //res.set('Content-Type', 'application/json');
       // res.status(200).json({toolType: toolType});
       // res.append("toolType", toolType);
       // fs.createReadStream(filePath).pipe(res);
        res.download(filePath,filename);

    })
}

//##########################################
//#### usuwanie sesji
//#######################################

exports.removeSession = (req,res,next) => {

  const userId = req.params.userId;
  const projectId = req.params.projectId;
  const sessionId = req.params.sessionId;

  let containersInThisSession = [];

  Session.findByIdAndRemove({_id:sessionId})
    .then(foundSession => {

        containersInThisSession = foundSession.containersIds;

        const sessionPath = appRoot + "/repo/" + userId + "/" + projectId + "/" + sessionId;

        //usuwam folder sesji z dysku fizycznie
        fs.rmdir(sessionPath,{recursive: true}, function (err) {
          if (err) throw err;

          //usuwam wpis w kolekcji Containers
          Container.deleteMany({_id: containersInThisSession})
          .then(removedContainers => {
            
                res.status(200).json({ message: 'The session has been removed!', sessionId: sessionId});
         
          })
          .catch(error => {
            res.status(500).json({ message: 'Something went wrong with removing the session!', sessionId: sessionId});
            console.log(error);
            throw error;
          })
        });
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

  //console.log("USUWAM CONTAONER: " + containerId)
  Container.findById({_id:containerId})
    .then(foundContainer => {

      //console.log("USUWAM CONTAONER: " + foundContainer)
        // tutaj usuwanie z repo, bazy danych, audio i txt

        const conainerFolder = utils.getFileNameWithNoExt(foundContainer.fileName);

        const containerPath = appRoot + "/repo/" + userId + "/" + projectId + "/" + sessionId + "/" + conainerFolder;

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
                
                //teraz zmieniam nazwe pliku na taki jaki był przesłany oryginalnie - usuwając unikatowe id i _temp.
                //Czyli przywracam plikowi oryginalna nazwe

                let tooryginal = utils.bringOryginalFileName(fullFilePath);
                fs.renameSync(fullFilePath, tooryginal);
                
               // fs.remove(fullFilePath)
               // .then(() => {
                    //console.log('Oryginalny plik został usunięty - pozostawiony tylko poprawnie przekonwertowany')

                    //zapisuje tą informaje do DB
                    let newContainer = new Container({
                      fileName: finalAudioFileName,
                      containerName: utils.getFileNameWithNoExt(oryginalFileName),
                      oryginalFileName: utils.getFileNameFromPath(tooryginal),
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

                    const shellcomm = 'audiowaveform -i '+fillCorrectAudioPath+' -o '+fillCorrectDATPath+' -z 32 -b 8 --input-format ' + ext;

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


               // })
               // .catch(err => {
                //  console.error('Problem z usunietceim pliku gdy istnieje już poprawnie przekonwertowany' + err)
               // })

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

