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

// #################################################################################
// ################### dodawanie nowego projektu ##################################
// #################################################################################

exports.createProject = (req, res, next) => {


     //resultaty validacji
    const error = validationResult(req);
   // console.log(req.body.projectName)
    if(!error.isEmpty()){
        console.log("ERROR")
        console.log(error.array())
        const errortothrow = new Error('Validation failed');
        errortothrow.statusCode = 422;
        throw error;
    }

    const reqProjectName = req.body.projectName;
    let owner;
    let createdProject;

    //tworze nowy wpis w bazie za pomoca modelu
    let projectEntry = new ProjectEntry({
        name: reqProjectName,
        owner: req.userId,
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
            return User.findById(req.userId);
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
            const dirpath = appRoot + '/repo/'+owner._id+'/'+projectEntry._id;

            mkdirp(dirpath, function(err) {

                if (err) {
                    console.log(err);
                    return err;
                } else {
                   
                    // tworze pliki demo

                    let demosession = new Session({
                        name: "demo",
                        projectId: projectEntry._id,
                    });
                  
                    //zapisuje sesje w DB
                    demosession.save()
                    .then(createdDemoSession => {
                
                        //odnajduje projet w DB i dodaje id tej sesji do niego
                        ProjectEntry.findByIdAndUpdate(projectEntry._id,{$push: {sessionIds: createdDemoSession._id}})
                        .then(updatedProject=> {
                
                            //tworze folder z demo na dysku dla tej sesji
                            let pathToDemoSession = dirpath + '/' + createdDemoSession._id;

                            try {
                                fsextra.mkdirsSync(pathToDemoSession);
                            } catch (err) {
                                res.status(500).json({ message: 'Problem with demo folder creation!'});
                                return console.error(err);
                            }

                            
                            copy(appRoot + '/demo_files', pathToDemoSession)
                                .on(copy.events.COPY_FILE_START, function(copyOperation) {
                                    console.info('Copying file ' + copyOperation.src + '...');
                                })
                                .on(copy.events.COPY_FILE_COMPLETE, function(copyOperation) {
                                    console.info('Copied to ' + copyOperation.dest);
                                })
                                .on(copy.events.ERROR, function(error, copyOperation) {
                                    console.error('Unable to copy ' + copyOperation.dest);
                                })
                                .then(function(results) {
                                    console.info(results.length + ' file(s) copied');

                                     /*
                                        let lektorDemo = new Container({
                                            fileName: 'lektor.wav',
                                            containerName: 'lektor',
                                            oryginalFileName: 'lektor.wav',
                                            size: fs.statSync(pathToDemoSession+"/lektor/lektor.wav").size,
                                            owner: owner,
                                            project: projectEntry._id,
                                            session: createdDemoSession._id,
                                            ifVAD: false,
                                            ifDIA: false,
                                            ifREC: false,
                                            ifSEG: false,
                                            statusVAD: 'ready',
                                            statusDIA: 'ready',
                                            statusREC: 'done',
                                            statusSEG: 'ready',
                                        });
                                        */


                                        let celnikDemo = new Container({
                                            fileName: 'celnik-1189e21a.wav',
                                            containerName: 'celnik',
                                            oryginalFileName: 'celnik.wav',
                                            size: fs.statSync(pathToDemoSession+"/celnik-1189e21a/celnik-1189e21a.wav").size,
                                            owner: owner,
                                            project: projectEntry._id,
                                            session: createdDemoSession._id,
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
                                            owner: owner,
                                            project: projectEntry._id,
                                            session: createdDemoSession._id,
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
                                            owner: owner,
                                            project: projectEntry._id,
                                            session: createdDemoSession._id,
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
                                            owner: owner,
                                            project: projectEntry._id,
                                            session: createdDemoSession._id,
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
                                            owner: owner,
                                            project: projectEntry._id,
                                            session: createdDemoSession._id,
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
                                        
                                        
                                        Container.insertMany(demoFiles)
                                        .then((insertedContainers)=>{
                                            
                                            //zbieram id kontekerow i wstawiam je do sesji

                                            let demoFilesIds = [];

                                            for(let i=0;i<insertedContainers.length;i++){
                                                demoFilesIds.push(insertedContainers[i]._id);
                                            }

                                            Session.findOneAndUpdate({_id:createdDemoSession._id},{$set: {containersIds: demoFilesIds}})
                                            .then(updatedSession=>{
                                                res.status(201).json({
                                                    message: 'The project created successfully!',
                                                    project: projectEntry,
                                                    owner: {_id: owner._id, name: owner.name}
                                                });
                                            }).catch(error => {
                                                console.log(error)
                                                throw error
                                            })

                                        }).catch((error)=>{
                                            console.log(error)
                                            throw error;
                                        })

                                })
                                .catch(function(error) {
                                    return console.error('Copy failed: ' + error);
                                });

                            //-----------end copy file catch
                          
                        }).catch(error => {
                            console.log(error)
                            throw error;
                        })


                    }).catch(error => {
                        console.log(error)
                        throw error;
                    })

                }
            });
        })
        .catch(error => {
            if(!error.statusCode){
                error.statusCode = 500;
            }
            next(error);
        })
}

// //dodawanie nowego projektu
// exports.createProject = (req, res, next) => {

//     //resultaty validacji
//     const error = validationResult(req);
//     console.log(req.body.projectName)
//     if(!error.isEmpty()){
//         console.log("ERROR")
//         console.log(error.array())
//         const errortothrow = new Error('Validation failed');
//         errortothrow.statusCode = 422;
//         throw error;
//     }

//     //--------------------------

//     const reqProjectName = req.body.projectName;
//     let owner;
//     let createdProject;

//     //tworze nowy wpis w bazie za pomoca modelu
//     let projectEntry = new ProjectEntry({
//         name: reqProjectName,
//         owner: req.userId,
//         accessToRead: [],
//         accessToEdit: [],
//         projectCreated: moment().format('MMMM Do YYYY, h:mm:ss a'),
//         files: [],
//     });

//     //zapisuje do bazy
//     projectEntry
//         .save()
//         .then(resultPE => {

//             createdProject = resultPE;

//             //znajduje uzytkownika w bazie
//             return User.findById(req.userId);
//         })
//         .then(user => {

//             //teraz to jest zalogowany user
//             //wydobywam wiec projekty tylko tego usera
//             owner = user;
//             //console.log(user)
//             user.projects.push(projectEntry);
//             return user.save();
//         })
//         .then(resultUser => {
//             //tutaj tworzenie folder z plikami projektu dla danego usera
//             const dirpath = appRoot + '/repo/'+owner._id+'/'+projectEntry._id;

          
//             mkdirp(dirpath, function(err) {

//                 // if any errors then print the errors to  console
//                 if (err) {
//                     console.log(err);
//                     return err;
//                 } else {
//                     try {
//                         //fs.statSync(appRoot + '/repo/demo_files');

//                          //tworze folder na wlasne pliki
//                          /*
//                         mkdirp(dirpath + '/my_files', function(err) {
//                             if (err) {
//                                 console.log(err);
//                                 return err;
//                             }
//                         })
//                         */

//                        console.log("zaczynam kopiowanie tych plikow")
//                        console.log(appRoot + '/repo/demo_files')
//                        console.log(dirpath + '/demo_files')

//                          //kopiuje pliki demo do repo usera
//                          fsextra.copy(appRoot + '/repo/demo_files', dirpath + '/demo_files')
//                             .then(() => {

//                                 console.log("Udalo sie przekopiowac powyzsze pliki i zaczynam procedure zapisywania plikow demo w DB")

//                                 //dodaje te pliki demo bo bazy danych

//                                 const sciezkaDoDemo = dirpath + '/demo_files';
                                
//                                 let nazwapliku;
//                                 nazwapliku = 'celnik.wav';
//                                 const celnik = new ProjectFile({
//                                     name: nazwapliku,
//                                     fileKey: 'demo_files/' + nazwapliku,
//                                     fileSize: fs.statSync(sciezkaDoDemo + '/'+nazwapliku).size,
//                                     fileModified: +moment(fs.statSync(sciezkaDoDemo + '/'+nazwapliku).mtime),
//                                     connectedWithFiles: []
//                                 });

//                                 nazwapliku = 'kleska.wav';
//                                 const kleska = new ProjectFile({
//                                     name: nazwapliku,
//                                     fileKey: 'demo_files/' + nazwapliku,
//                                     fileSize: fs.statSync(sciezkaDoDemo + '/'+nazwapliku).size,
//                                     fileModified: +moment(fs.statSync(sciezkaDoDemo + '/'+nazwapliku).mtime),
//                                     connectedWithFiles: []
//                                 });

//                                 nazwapliku = 'lektor.wav';
//                                 const lektor = new ProjectFile({
//                                     name: nazwapliku,
//                                     fileKey: 'demo_files/' + nazwapliku,
//                                     fileSize: fs.statSync(sciezkaDoDemo + '/'+nazwapliku).size,
//                                     fileModified: +moment(fs.statSync(sciezkaDoDemo + '/'+nazwapliku).mtime),
//                                     connectedWithFiles: []
//                                 });

//                                 nazwapliku = 'mowa.wav';
//                                 const mowa = new ProjectFile({
//                                     name: nazwapliku,
//                                     fileKey: 'demo_files/' + nazwapliku,
//                                     fileSize: fs.statSync(sciezkaDoDemo + '/'+nazwapliku).size,
//                                     fileModified: +moment(fs.statSync(sciezkaDoDemo + '/'+nazwapliku).mtime),
//                                     connectedWithFiles: []
//                                 });

//                                 nazwapliku = 'opowiesci.wav';
//                                 const opowiesci = new ProjectFile({
//                                     name: nazwapliku,
//                                     fileKey: 'demo_files/' + nazwapliku,
//                                     fileSize: fs.statSync(sciezkaDoDemo + '/'+nazwapliku).size,
//                                     fileModified: +moment(fs.statSync(sciezkaDoDemo + '/'+nazwapliku).mtime),
//                                     connectedWithFiles: []
//                                 });


//                                 nazwapliku = 'senator.wav';
//                                 const senator = new ProjectFile({
//                                     name: nazwapliku,
//                                     fileKey: 'demo_files/' + nazwapliku,
//                                     fileSize: fs.statSync(sciezkaDoDemo + '/'+nazwapliku).size,
//                                     fileModified: +moment(fs.statSync(sciezkaDoDemo + '/'+nazwapliku).mtime),
//                                     connectedWithFiles: []
//                                 });

//                                 //folder na wlasne pliki
//                                 // nazwapliku = 'my_files';
//                                 // const my_files_folder = new ProjectFile({
//                                 //     name: nazwapliku,
//                                 //     fileKey: nazwapliku + '/',
//                                 //     fileSize: 0,
//                                 //     fileModified: 0,
//                                 //     connectedWithFiles: []
//                                 // });

//                                 //tworze powiazania między plikami w demo
//                                 //test_txt.connectedWithFiles.push(test_wav._id);
//                                 //test_wav.connectedWithFiles.push(test_txt._id);

//                                 //dodaje pliki demo do projektu
//                                 projectEntry.files.push(celnik);
//                                 projectEntry.files.push(kleska);
//                                 projectEntry.files.push(lektor);
//                                 projectEntry.files.push(mowa);
//                                 projectEntry.files.push(opowiesci);
//                                 projectEntry.files.push(senator);

                                
//                                 //zapisuje pliki w kolekcji z plikami z odniesieniem do projektu
//                                 projectEntry.save()
//                                 .then(resultProjectentry => {

//                                     // else print a success message.
//                                     console.log("Successfully created project directory for this user");
//                                     res.status(201).json({
//                                         message: 'The project created successfully!',
//                                         project: projectEntry,
//                                         owner: {_id: owner._id, name: owner.name}
//                                     });
//                                 })
//                             })
//                             .catch(err => {
//                                 console.log("cos poszlo nie tak z kopiowaniem plikow")
//                                 console.error(err);
//                                 return err;
//                             })
//                     } catch(e) {
//                         console.log("BLAD W PRZENOSZENIU KATALOGU DEMO");
//                         const error = new Error('No demo files in the server!');
//                         error.statusCode = 501;
//                         throw error;
//                         /*
//                         res.status(201).json({
//                             message: 'The project created successfully!',
//                             project: projectEntry,
//                             owner: {_id: owner._id, name: owner.name}
//                         });
//                         */
//                     }
//                 }
//             });
//         })
//         .catch(error => {
//             if(!error.statusCode){
//                 error.statusCode = 500;
//             }
//             next(error);
//         })
// }

//usuwanie projektu
exports.deleteProject = (req,res,next) => {
    const projectId = req.body.idprojektu;

   // console.log("DELETE PROJECT")
  //  console.log(req.body.idprojektu);

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


             //usuwam z bazy sesje projektu oraz kontenery
             //return Session.findByIdAndRemove({_id: projectToDelete.sessionIds});

             Session.deleteMany({_id: projectToDelete.sessionIds})
             .then(removedSessions => {
                Container.deleteMany({project: projectToDelete._id})
                .then(removedContainer => {
                        //usuwam wszystkie pliki w projekcie danego uzytkownika
                        const dirpath = appRoot + '/repo/'+req.userId + '/'+projectId;
                        rimraf(dirpath, function(err) {
                            if (err) {
                                console.log(err);
                                return err;
                            } else {
                                res.status(200).json({message: 'Project removed!', projectId: projectId})
                                console.log("Successfully deleted a user directory");
                            }
                        });
                    })
             })
        })
        .catch(error => {
            if(!error.statusCode){
                error.statusCode = 500;
            }
            next(error);
        });
}


//edycja nazwy projektu
exports.updateProjectName = (req, res,next) => {
    //resultaty validacji
    const error = validationResult(req);

    console.log("updateProjectName");
    console.log(req.headers);
    //console.log(projectName);

    if(!error.isEmpty()){
        const error = new Error('Validation failed');
        error.statusCode = 422;
        console.log(error)
        throw error;
    }

    const projectId = req.body.projectId;
    const newprojectName = req.body.newProjectName;

    ProjectEntry.findById(projectId)
        .then(projectEntry => {
            if(!projectEntry){
                const error = new Error('Could not find the project entry');
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
            res.status(200).json({message: 'Project updated!', projectEntry: projectEntry})
        })
        .catch(error => {
            if(!error.statusCode){
                error.statusCode = 500;
            }
            next(error);
        });
}

//utility do usuwania plikow z serwera
const removeFile = filePath => {
    filePath = path.join(__dirname,'..',filePath);
    fs.unlink(filePath, error => {
        console.log(error)
    });
}  