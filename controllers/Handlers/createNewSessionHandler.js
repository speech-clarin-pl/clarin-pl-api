const fs = require('fs-extra');
const appRoot = require('app-root-path'); //zwraca roota aplikacji
const ProjectEntry = require('../../models/projectEntry');
const Session = require('../../models/Session');


module.exports = (sesName, projId) => {
    return new Promise(async (resolve, reject) => {
  
        const sessionName = sesName;
        const projectId = projId;
  
        let userId = null;
        let sessionId = null;
        
        ProjectEntry.findById(projectId).then(foundProject=>{
          if(!foundProject){
            const projIDError = new Error("Nie znaleziono projektu o zadanym ID");
            throw projIDError;
          }
          return foundProject.owner;
        }).then(owner => {
          userId = owner;
  
          //walidacja nazwy sesji
          const sessNameError = new Error("Błędna nazwa sesji lub jej brak!");
          if(!sessionName){
            throw sessNameError;
          } else{
            if(sessionName.trim().length < 1 || sessionName.trim().length > 100){
              throw sessNameError;
            }
          }
          
  
          let session = new Session({
            name: sessionName,
            projectId: projectId,
          });
  
          return session.save();
        }).then(createdSession=>{
          sessionId = createdSession._id;
          return ProjectEntry.findByIdAndUpdate(projectId,{$push: {sessionIds: createdSession._id}});
        }).then(updatedProject =>{
          
          const repoPath = appRoot + "/repo/" + userId + "/" + projectId;
          fs.mkdir(repoPath + '/' + sessionId).then(()=>{
            return sessionId;
          }).catch(error=>{
            throw error;
          }) 
        }).then(()=>{
          resolve(sessionId);
        }).catch(error=>{
          error.statusCode = error.statusCode || 500;
          reject(error)
        });
    });
  }