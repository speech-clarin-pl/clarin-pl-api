const fs = require('fs-extra');
const path = require('path');

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


//##########################################
//#### usuwanie pojedynczego kontenera z repo ######
//#######################################

exports.removeContainer = (req,res,next) => {

  const userId = req.params.userId;
  const projectId = req.params.projectId;
  const sessionId = req.params.sessionId;
  const containerId = req.params.containerId;

  // tutaj usuwanie z repo, bazy danych, audio i txt
  const repoPath = appRoot + "/repo/" + userId + "/" + projectId + "/" + sessionId;

  Container.findById(containerId)
    .then(foundContainer => {

        //usuwam plik z dysku fizycznie
        fs.unlink(repoPath + '/' + foundContainer.fileName, function (err) {
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

  const savedFile = req.file.filename; // z unikatowym id
  const oryginalFileName = req.file.originalname; //nazwa oryginalnego pliku

  const userId = req.body.userId;
  const projectId = req.body.projectId;
  const sessionId = req.body.sessionId;

  const finalFileDest = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/';
  const fullFilePath = finalFileDest + savedFile;

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

