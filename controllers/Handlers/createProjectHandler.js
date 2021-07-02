
const moment = require('moment');
const fsextra = require('fs-extra');
var copy = require('recursive-copy');
const ProjectEntry = require('../../models/projectEntry');
const Container = require('../../models/Container')
const User = require('../../models/user');
const Session = require('../../models/Session');
const chalk = require('chalk');
var mkdirp = require("mkdirp"); //do tworzenia folderu
var appRoot = require('app-root-path'); //zwraca roota aplikacji

const createDemoFiles = require('./createDemoFiles');

module.exports = (projectName, ownerID) => {
    return new Promise(async (resolve, reject) => {

        try {
            const reqProjectName = projectName;
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
               // accessToRead: [],
               // accessToEdit: [],
                projectCreated: moment().format('MMMM Do YYYY, h:mm:ss a'),
                files: [],
            });
        
            //zapisuje do bazy
            createdProject = await projectEntry.save();
            let user = await User.findById(ownerID);
            owner = user;
            user.projects.push(projectEntry);
    
            await user.save();
    
            dirpath = appRoot + '/repo/'+owner._id+'/'+createdProject._id;
    
            //tworze folder dla projektu
            mkdirp.sync(dirpath);
    
            // tworze sesje demo
            demoSession = new Session({
                name: "demo",
                projectId: projectEntry._id,
            });
    
            //zapisuje sesje w DB
            await demoSession.save();
    
            const updatedProject = await ProjectEntry.findByIdAndUpdate(projectEntry._id,{$push: {sessionIds: demoSession._id}},{new: true});
    
            projectEntry = updatedProject;
    
            //tworze folder z demo na dysku dla tej sesji
            pathToDemoSession = dirpath + '/' + demoSession._id;
     
            fsextra.mkdirsSync(pathToDemoSession);
    
    
            //kopiuje pliki demo do folderu użytkownika
            await copy(appRoot + '/demo_files', pathToDemoSession)
                            .on(copy.events.COPY_FILE_START, function(copyOperation) {
                                //console.info('Copying file ' + copyOperation.src + '...');
                            })
                            .on(copy.events.COPY_FILE_COMPLETE, function(copyOperation) {
                                //console.info('Copied to ' + copyOperation.dest);
                            })
                            .on(copy.events.ERROR, function(error, copyOperation) {
                                console.log(chalk.red('Unable to copy ' + copyOperation.dest));
                            });
    
            const demoFiles = createDemoFiles(owner._id, createdProject._id, demoSession._id);
    
            const insertedContainers = await Container.insertMany(demoFiles);
    
            //zbieram id kontekerow i wstawiam je do sesji
            let demoFilesIds = [];
            for(let i=0;i<insertedContainers.length;i++){
                demoFilesIds.push(insertedContainers[i]._id);
            }
    
            const updatedSession = await Session.findOneAndUpdate({_id:demoSession._id},{$set: {containersIds: demoFilesIds}});
    
            resolve({demoSession:updatedSession, 
                //defaultSession: defaultSession,
                project: projectEntry, 
                owner: owner});

        } catch (error) {
            reject(error)
        }
      
       

           
    });
}