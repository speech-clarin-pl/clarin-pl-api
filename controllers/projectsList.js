const fs = require('fs');
const path = require('path');
const moment = require('moment');
const fsextra = require('fs-extra');
const utilsForFiles = require('../utils/utils');
var copy = require('recursive-copy');

const {validationResult} = require('express-validator/check');

//importuje model wpisu projektu
const ProjectEntry = require('../models/projectEntry');
const ProjectFile = require('../models/projectFile');
const Container = require('../models/Container')
const User = require('../models/user');
const chalk = require('chalk');

var mkdirp = require("mkdirp"); //do tworzenia folderu
var rimraf = require("rimraf"); 
var appRoot = require('app-root-path'); //zwraca roota aplikacji

const Session = require('../models/Session');

//kontroler do wydobywania listy projektow
exports.getProjectsList = (req, res, next) => {

    ProjectEntry.find({owner: req.userId}).sort({"createdAt": "desc"})
        .then(projectsList => {
            if(!projectsList){
                const error = new Error('Could not find any project');
                error.statusCode = 404;
                throw error;
            }
            res.status(200).json({message: 'Projects list featched!', projects: projectsList})
        })
        .catch(error => {
            if(!error.statusCode){
                error.statusCode = 500;
            }
            next(error);
        });

    // res.status(200).json({
    //     projects: [
    //         {
    //             _id: 'p1',
    //             name: 'Jakiś tytuł projektu Mariusz :)',
    //             owner: 'You',
    //             modified: new Date(),
    //             owner: "idOwnera1",
    //             accessToRead: [],
    //             accessToEdit: []
    //         },

}


createDemoFiles = (ownerId, projectId, sessionId) => {


    const dirpath = appRoot + '/repo/'+ownerId+'/'+projectId;
    const pathToDemoSession = dirpath + '/' + sessionId;

    let celnikDemo = new Container({
        fileName: 'celnik-1189e21a.wav',
        containerName: 'celnik',
        oryginalFileName: 'celnik.wav',
        size: fs.statSync(pathToDemoSession+"/celnik-1189e21a/celnik-1189e21a.wav").size,
        owner: ownerId,
        project: projectId,
        session: sessionId,
        ifVAD: true,
        ifDIA: true,
        ifREC: true,
        ifSEG: true,
        statusVAD: 'done',
        statusDIA: 'done',
        statusREC: 'done',
        statusSEG: 'done',
        VADUserSegments:  [{
            "startTime": 0.68,
            "endTime": 2.74,
            "editable": true,
            "color": "#394b55",
            "labelText": "speech"
        }, {
            "startTime": 2.74,
            "endTime": 5.97,
            "editable": true,
            "color": "#394b55",
            "labelText": "speech"
        }],
        DIAUserSegments:  [{
            "startTime": 0.68,
            "endTime": 2.74,
            "editable": true,
            "color": "#394b55",
            "labelText": "1"
        }, {
            "startTime": 2.74,
            "endTime": 4.62,
            "editable": true,
            "color": "#394b55",
            "labelText": "2"
        }, {
            "startTime": 4.62,
            "endTime": 5.97,
            "editable": true,
            "color": "#394b55",
            "labelText": "3"
        }],
        RECUserSegments: [],
        SEGUserSegments: [],
    });

    

    let kleskaDemo = new Container({
        fileName: 'kleska-29d61ce0.wav',
        containerName: 'kleska',
        oryginalFileName: 'kleska.wav',
        size: fs.statSync(pathToDemoSession+"/kleska-29d61ce0/kleska-29d61ce0.wav").size,
        owner: ownerId,
        project: projectId,
        session: sessionId,
        ifVAD: true,
        ifDIA: true,
        ifREC: false,
        ifSEG: false,
        statusVAD: 'done',
        statusDIA: 'done',
        statusREC: 'ready',
        statusSEG: 'ready',
        VADUserSegments: [{
            "startTime": 1.31,
            "endTime": 7.81,
            "editable": true,
            "color": "#394b55",
            "labelText": "speech"
        }],
        DIAUserSegments:  [{
            "startTime": 1.31,
            "endTime": 4.69,
            "editable": true,
            "color": "#394b55",
            "labelText": "3"
        }, {
            "startTime": 4.68,
            "endTime": 6.18,
            "editable": true,
            "color": "#394b55",
            "labelText": "1"
        }, {
            "startTime": 6.18,
            "endTime": 7.81,
            "editable": true,
            "color": "#394b55",
            "labelText": "2"
        }],
        RECUserSegments: [],
        SEGUserSegments: [],
    });

    
    let mowaDemo = new Container({
        fileName: 'mowa-b8c9e2fb.wav',
        containerName: 'mowa',
        oryginalFileName: 'mowa.wav',
        size: fs.statSync(pathToDemoSession+"/mowa-b8c9e2fb/mowa-b8c9e2fb.wav").size,
        owner: ownerId,
        project: projectId,
        session: sessionId,
        ifVAD: true,
        ifDIA: true,
        ifREC: true,
        ifSEG: true,
        statusVAD: 'done',
        statusDIA: 'done',
        statusREC: 'done',
        statusSEG: 'done',
        VADUserSegments:  [{
            "startTime": 0.54,
            "endTime": 4.66,
            "editable": true,
            "color": "#394b55",
            "labelText": "speech"
        }, {
            "startTime": 4.7,
            "endTime": 10.16,
            "editable": true,
            "color": "#394b55",
            "labelText": "speech"
        }],
        DIAUserSegments: [{
            "startTime": 0.54,
            "endTime": 2.42,
            "editable": true,
            "color": "#394b55",
            "labelText": "3"
        }, {
            "startTime": 2.42,
            "endTime": 4.66,
            "editable": true,
            "color": "#394b55",
            "labelText": "2"
        }, {
            "startTime": 4.7,
            "endTime": 5.83,
            "editable": true,
            "color": "#394b55",
            "labelText": "2"
        }, {
            "startTime": 5.83,
            "endTime": 8.82,
            "editable": true,
            "color": "#394b55",
            "labelText": "3"
        }, {
            "startTime": 8.82,
            "endTime": 10.16,
            "editable": true,
            "color": "#394b55",
            "labelText": "1"
        }],
        RECUserSegments: [],
        SEGUserSegments: [],
    });

    let opowiesciDemo = new Container({
        fileName: 'opowiesci-811cddd0.wav',
        containerName: 'opowiesci',
        oryginalFileName: 'opowiesci.wav',
        size: fs.statSync(pathToDemoSession+"/opowiesci-811cddd0/opowiesci-811cddd0.wav").size,
        owner: ownerId,
        project: projectId,
        session: sessionId,
        ifVAD: true,
        ifDIA: false,
        ifREC: false,
        ifSEG: false,
        statusVAD: 'done',
        statusDIA: 'ready',
        statusREC: 'ready',
        statusSEG: 'ready',
        VADUserSegments: [{
            "startTime": 0.87,
            "endTime": 6.61,
            "editable": true,
            "color": "#394b55",
            "labelText": "speech"
        }],
        DIAUserSegments: [],
        RECUserSegments: [],
        SEGUserSegments: [],
    });

    let senatorDemo = new Container({
        fileName: 'senator-137ebd23.wav',
        containerName: 'senator',
        oryginalFileName: 'senator.wav',
        size: fs.statSync(pathToDemoSession+"/senator-137ebd23/senator-137ebd23.wav").size,
        owner: ownerId,
        project: projectId,
        session: sessionId,
        ifVAD: true,
        ifDIA: true,
        ifREC: true,
        ifSEG: false,
        statusVAD: 'done',
        statusDIA: 'done',
        statusREC: 'done',
        statusSEG: 'ready',
        VADUserSegments:  [{
            "startTime": 0.12,
            "endTime": 7.73,
            "editable": true,
            "color": "#394b55",
            "labelText": "speech"
        }],
        DIAUserSegments:  [{
            "startTime": 0.12,
            "endTime": 3.5,
            "editable": true,
            "color": "#394b55",
            "labelText": "3"
        }, {
            "startTime": 3.5,
            "endTime": 5.75,
            "editable": true,
            "color": "#394b55",
            "labelText": "2"
        }, {
            "startTime": 5.75,
            "endTime": 6.5,
            "editable": true,
            "color": "#394b55",
            "labelText": "3"
        }, {
            "startTime": 6.5,
            "endTime": 7.73,
            "editable": true,
            "color": "#394b55",
            "labelText": "1"
        }],
        RECUserSegments: [],
        SEGUserSegments: [],
    });

    const demoFiles = [celnikDemo, kleskaDemo, mowaDemo, opowiesciDemo, senatorDemo];

    return demoFiles;
}



exports.createProjectHandler = (projectName, ownerID, ifDefaultSession = false) => {
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
                    return ProjectEntry.findByIdAndUpdate(projectEntry._id,{$push: {sessionIds: [demoSession._id, defaultSession._id]}});
                } else {
                    //odnajduje projet w DB i dodaje id tej sesji do niego
                    return ProjectEntry.findByIdAndUpdate(projectEntry._id,{$push: {sessionIds: demoSession._id}});
                }
            })
            .then(updatedProject => {
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
                resolve({session:updatedSession, 
                    project: projectEntry, 
                    owner: owner});
            })
            .catch(error => {
                reject(error);
            })
    });
}



/**
 * @api {post} /projectsList/addProject Nowy Projekt
 * @apiDescription Tworzenie nowego projektu na potrzeby budowy nowego korpusu. Pliki w projekcie zorganizowane są w sesje. Podczas tworzenia projektu, tworzona jest domyślna sesja demo którą można usunąć.
 * @apiName CreateProject
 * @apiGroup Pliki
 *
 * @apiParam {String} projectName Nazwa projektu
 * @apiHeader {String} Authorization Ciąg znaków 'Bearer token' gdzie w miejsce 'token' należy wstawić token uzyskany podczas logowania.
 * @apiSuccess {String} message wiadomość że projekt został utworzony.
 * @apiSuccess {Object} project Informacje o nowym projekcie w postaci JSON.
 * 
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "message": 'Projekt został utworzony!',
 *       "project": { accessToRead: [],
 *                         accessToEdit: [],
 *                         sessionIds: [],
 *                         _id: 5fe99be5d831b7c009e36fbb,
 *                         name: 'sampleProject',
 *                         owner: 5fe39a36daa13f1fa38e1e06,
 *                         projectCreated: 'December 28th 2020, 9:48:37 am',
 *                         createdAt: 2020-12-28T08:48:37.558Z,
 *                         updatedAt: 2020-12-28T08:48:37.558Z,
 *                         __v: 0 }
 *     }
 *
 * @apiError (422) ValidationFailed Błędna nazwa projektu
 * 
 * 
 */


// #################################################################################
// ################### dodawanie nowego projektu ##################################
// #################################################################################

exports.createProject = (req, res, next) => {

    const reqProjectName = req.body.projectName;
    const owner = req.userId;

    if(owner){
        const error = validationResult(req);
        if(!error.isEmpty()){
            console.log(chalk.red(error.array()))
            const errortothrow = new Error('Validation failed');
            errortothrow.statusCode = 422;
            throw errortothrow;
        }
        
        this.createProjectHandler(reqProjectName, owner).then((results)=>{
        res.status(201).json({message: 'Projekt został utworzony!',
                                project: results.project
                                });

                                // owner: {_id: results.owner._id, name: results.owner.name}
        }).catch((error)=>{
            console.log(chalk.red(error.message));
            next(error);
        });
    } else {
        const err = new Error('Unauthorized');
        errortothrow.statusCode = 401;
        next(err);
    }

}


// TO DO: dorobić usuwanie projektu po określonym czasie - np. po 30 dniach.
/**
 * @api {delete} /projectsList/removeProject/:projectId Usuwanie Projektu
 * @apiDescription Wywołanie powoduje skasowanie projektu wraz z jego zawartością. Używaj z rozwagą gdyż po usunięciu nie ma możliwości odzyskania danych.
 * @apiName RemoveProject
 * @apiGroup Pliki
 *
 * @apiParam {String} projectId Id projektu do usunięcia
 * @apiHeader {String} Authorization Ciąg znaków 'Bearer token' gdzie w miejsce 'token' należy wstawić token uzyskany podczas logowania.
 * @apiSuccess {String} message wiadomość że projekt został usunięty.
 * @apiSuccess {String} projectId Id usuniętego projektu
 * 
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "message": 'Projekt usunięty!',
 *       "projectId": 5fe99be5d831b7c009e36fbb
 *     }
 *
 * @apiError (403) Not authorized Błędna nazwa projektu
 * 
 * 
 */

// #################################################################################
// ################### usuwanie projektu ##################################
// #################################################################################
exports.deleteProject = (req,res,next) => {
    const projectId = req.params.projectId;

    let projectToDelete;

    ProjectEntry.findById(projectId)
        .then(projectEntry => {

            if(!projectEntry){
                const error = new Error('Could not find the project entry');
                error.statusCode = 404;
                throw error;
            }

            //sprawdzam czy usuwania dokonuje zalogowana osoba
            if(projectEntry.owner.toString() !== req.userId){
                const error = new Error('Not authorized!');
                error.statusCode = 403;
                throw error;
            }
            
            //usuwam z bazy ten projekt
            return ProjectEntry.findByIdAndRemove(projectId);
        })
        .then(projectEntry => {
            
            projectToDelete = projectEntry;

             //czyszcze relacje z kolekcja usera- tam tez trzeba wyrzucic referencje do projektu
             return User.findByIdAndUpdate(req.userId, {$pull: {projects: projectId}})
        })
        .then(user => {
             return Session.deleteMany({_id: projectToDelete.sessionIds});
        })
        .then(removedSessions => {
             return Container.deleteMany({project: projectToDelete._id});
        }).then(removedContainer => {
                //usuwam wszystkie pliki w projekcie danego uzytkownika
                const dirpath = appRoot + '/repo/'+req.userId + '/'+projectId;
                rimraf(dirpath, (err) => {
                    if (err) {
                        console.log(chalk.red(err.message));
                        throw err;
                    } else {
                        res.status(200).json({message: 'Projekt usunięty!', projectId: projectId})
                    }
                });
         })
        .catch(error => {
            if(!error.statusCode){
                error.statusCode = 500;
            }
            error.message = "Coś poszło nie tak z usuwaniem projektu. Może to być spowodowane błędnym ID"
            console.log(chalk.red(error.message));
            next(error);
        });
}


/**
 * @api {put} /projectsList/updateProjectName/:projectId Zmiana nazwy projektu
 * @apiDescription Zmiana nazwy istniejącego projektu
 * @apiName UpdateNameProject
 * @apiGroup Pliki
 *
 * @apiParam {String} projectId Id projektu do usunięcia
 * @apiParam {String} newProjectName Nowa nazwa
 * 
 * @apiHeader {String} Authorization Ciąg znaków 'Bearer token' gdzie w miejsce 'token' należy wstawić token uzyskany podczas logowania.
 * @apiSuccess {String} message wiadomość że projekt został usunięty.
 * @apiSuccess {String} projectId Id usuniętego projektu
 * @apiSuccess {String} newName nowa nazwa projektu
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "message": 'Nazwa projektu zaktualizowana!',
 *       "projectId": 5fe99be5d831b7c009e36fbb,
 *       "newName": newName
 *     }
 *
 * @apiError (422) ValidationFailed Błędna nazwa projektu
 * @apiError (403) NotAuthorized nieautoryzowany dostęp
 * @apiError (404) NotFound nie znaleziono projektu
 * 
 * 
 */


// ############################################################################
// ################### edycja nazwy projektu ##################################
// ############################################################################

exports.updateProjectName = (req, res,next) => {
    //resultaty validacji
    const error = validationResult(req);

    if(!error.isEmpty()){
        const error = new Error('Validation failed');
        error.statusCode = 422;
        console.log(error)
        throw error;
    }

    const projectId = req.params.projectId;
    const newprojectName = req.body.newProjectName;

    ProjectEntry.findById(projectId)
        .then(projectEntry => {
            if(!projectEntry){
                const error = new Error('Nie mogłem znaleźć projektu');
                error.statusCode = 404;
                throw error;
            }

            //sprawdzam czy updatu dokonuje zalogowana osoba
            if(projectEntry.owner.toString() !== req.userId){
                const error = new Error('Not authorized!');
                error.statusCode = 403;
                throw error;
            }

            //zapisuje do bazy update
            projectEntry.name = newprojectName;
            return projectEntry.save();
        })
        .then(projectEntry => {
            //rezultat zapisywania do bazy
           res.status(200).json({message: 'Nazwa projektu zaktualizowana!', projectId: projectEntry._id, newName: newprojectName})
        })
        .catch(error => {
            if(!error.statusCode){
                error.statusCode = 500;
            }
            next(error);
        });
}

//utility do usuwania plikow z serwera
/*
const removeFile = filePath => {
    filePath = path.join(__dirname,'..',filePath);
    fs.unlink(filePath, error => {
        console.log(error)
    });
} 
*/ 