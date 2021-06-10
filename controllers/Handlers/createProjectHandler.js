const fs = require('fs');
const path = require('path');
const moment = require('moment');
const fsextra = require('fs-extra');
const utilsForFiles = require('../../utils/utils');
var copy = require('recursive-copy');

const {validationResult} = require('express-validator/check');

//importuje model wpisu projektu
const ProjectEntry = require('../../models/projectEntry');
const ProjectFile = require('../../models/projectFile');
const Container = require('../../models/Container')
const User = require('../../models/user');
const Session = require('../../models/Session');


const chalk = require('chalk');

var mkdirp = require("mkdirp"); //do tworzenia folderu
var rimraf = require("rimraf"); 
var appRoot = require('app-root-path'); //zwraca roota aplikacji

const createDemoFiles = require('./createDemoFiles');

module.exports = (projectName, ownerID, ifDefaultSession = true) => {
    const reqProjectName = projectName;

    return new Promise((resolve, reject) => {
      
        let owner;
        let createdProject;
        let demoSession;
        let defaultSession;
        let dirpath;
        let pathToDemoSession;

        //tworze nowy wpis w bazie za pomoca modelu
        let projectEntry = new ProjectEntry({
            name: reqProjectName,
            owner: ownerID,
            accessToRead: [],
            accessToEdit: [],
            projectCreated: moment().format('MMMM Do YYYY, h:mm:ss a'),
            files: [],
        });
    
        //zapisuje do bazy
        projectEntry
            .save()
            .then(resultPE => {
    
                createdProject = resultPE;
                //znajduje uzytkownika w bazie
                //return User.findById(req.userId);
                return User.findById(ownerID);
            })
            .then(user => {
                //teraz to jest zalogowany user
                //wydobywam wiec projekty tylko tego usera
                owner = user;
                user.projects.push(projectEntry);
                return user.save();
            })
            .then(resultUser => {
    
                //tutaj tworzenie folder z plikami projektu dla danego usera
                dirpath = appRoot + '/repo/'+owner._id+'/'+projectEntry._id;

                try {

                    const made = mkdirp.sync(dirpath);

                    // tworze sesje demo
                    demoSession = new Session({
                        name: "demo",
                        projectId: projectEntry._id,
                    });

                    //zapisuje sesje w DB
                    return demoSession.save()

                } catch (error) {
                    reject(error);
                }
            })
            .then(createdDemoSession => {
                  //tworze sesje domyślną
                  if(ifDefaultSession){
                        defaultSession = new Session({
                            name: "Domyślna sesja",
                            projectId: projectEntry._id,
                        });

                        //zapisuje sesje w DB
                        return defaultSession.save()
                    } else {
                        return true;
                    }
            })
            .then(createdDefaultSession => {
                if(ifDefaultSession){
                    //odnajduje projet w DB i dodaje id tej sesji do niego
                    return ProjectEntry.findByIdAndUpdate(projectEntry._id,{$push: {sessionIds: [demoSession._id, defaultSession._id]}},{new: true});
                } else {
                    //odnajduje projet w DB i dodaje id tej sesji do niego
                    return ProjectEntry.findByIdAndUpdate(projectEntry._id,{$push: {sessionIds: demoSession._id}},{new: true});
                }
            })
            .then(updatedProject => {

                projectEntry = updatedProject;
                 //tworze folder z demo na dysku dla tej sesji
                 pathToDemoSession = dirpath + '/' + demoSession._id;
                 try {
                     fsextra.mkdirsSync(pathToDemoSession);
                 } catch (err) {
                     err.message = 'Problem with demo folder creation!';
                     reject(err);
                 }

                 //kopiuje pliki demo do folderu użytkownika
                 return copy(appRoot + '/demo_files', pathToDemoSession)
                                    .on(copy.events.COPY_FILE_START, function(copyOperation) {
                                        //console.info('Copying file ' + copyOperation.src + '...');
                                    })
                                    .on(copy.events.COPY_FILE_COMPLETE, function(copyOperation) {
                                        //console.info('Copied to ' + copyOperation.dest);
                                    })
                                    .on(copy.events.ERROR, function(error, copyOperation) {
                                        console.log(chalk.red('Unable to copy ' + copyOperation.dest));
                                    })
            })
            .then(results => {
                console.info(results.length + ' file(s) copied');          
                const demoFiles = createDemoFiles(owner._id, createdProject._id, demoSession._id);
                return Container.insertMany(demoFiles);
            })
            .then(insertedContainers => {
                    //zbieram id kontekerow i wstawiam je do sesji

                    let demoFilesIds = [];
                    for(let i=0;i<insertedContainers.length;i++){
                        demoFilesIds.push(insertedContainers[i]._id);
                    }

                    return Session.findOneAndUpdate({_id:demoSession._id},{$set: {containersIds: demoFilesIds}})
                    
            })
            .then(updatedSession => {
                resolve({demoSession:updatedSession, 
                    defaultSession: defaultSession,
                    project: projectEntry, 
                    owner: owner});
            })
            .catch(error => {
                reject(error);
            })
    });
}