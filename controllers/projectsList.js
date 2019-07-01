const fs = require('fs');
const path = require('path');
const moment = require('moment');
const fsextra = require('fs-extra');

const {validationResult} = require('express-validator/check');

//importuje model wpisu projektu
const ProjectEntry = require('../models/projectEntry');
const User = require('../models/user');

var mkdirp = require("mkdirp"); //do tworzenia folderu
var rimraf = require("rimraf"); 
var appRoot = require('app-root-path'); //zwraca roota aplikacji

//kontroler do wydobywania listy projektow
exports.getProjectsList = (req, res, next) => {

    ProjectEntry.find({owner: req.userId}).sort({"createdAt": "desc"})
        .then(projectsList => {
            if(!projectsList){
                const error = new Error('Could not find any project');
                error.statusCode = 404;
                throw error;
            }


           // console.log(projectsList)
           // console.log("-----------------")
           // console.log(formatterProjectsList)

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


//dodawanie nowego projektu
exports.createProject = (req, res, next) => {

    //resultaty validacji
    const error = validationResult(req);
    console.log(req.body.projectName)
    if(!error.isEmpty()){
        console.log("ERROR")
        console.log(error.array())
        const errortothrow = new Error('Validation failed');
        errortothrow.statusCode = 422;
        throw error;
    }

    const reqProjectName = req.body.projectName;
    let owner;

    //tworze nowy wpis w bazie za pomoca modelu
    const projectEntry = new ProjectEntry({
        name: reqProjectName,
        owner: req.userId,
        accessToRead: [],
        accessToEdit: [],
        projectCreated: moment().format('MMMM Do YYYY, h:mm:ss a'),
    });

    //zapisuje do bazy
    projectEntry
        .save()
        .then(result => {
            //znajduje uzytkownika w bazie
            return User.findById(req.userId);
        })
        .then(user => {

            //teraz to jest zalogowany user
            //wydobywam wiec projekty tylko tego usera
            owner = user;
            console.log(user)
            user.projects.push(projectEntry);
            return user.save();

        })
        .then(result => {

            //tutaj tworzenie folder z plikami projektu dla danego usera
            const dirpath = appRoot + '/repo/'+owner._id+'/'+projectEntry._id;
            mkdirp(dirpath, function(err) {
                // if any errors then print the errors to our console
                if (err) {
                    console.log(err);
                    return err;
                } else {

                    //kopiuje pliki demo do repo usera
                    fsextra.copy(appRoot + '/repo/demo_files', dirpath + '/demo_files', function (err) {
                        if (err) {
                          console.error(err);
                          return err;
                        } else {
                          
                           // else print a success message.
                            console.log("Successfully created project directory for this user");
                            res.status(201).json({
                                message: 'The project created successfully!',
                                project: projectEntry,
                                owner: {_id: owner._id, name: owner.name}
                            });
                        }
                      });

                   
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

//usuwanie projektu
exports.deleteProject = (req,res,next) => {
    const projectId = req.body.idprojektu;

    console.log("DELETE PROJECT")
    console.log(req.body.idprojektu)

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


            
            //usuwam z bazy ten projekt
            return ProjectEntry.findByIdAndRemove(projectId);
        })
        .then(projectEntry => {
            
            let projectToDelete = projectEntry;
            return User.findById(req.userId);
            
        })
        .then(user => {
            //czyszcze relacje z colekcja usera- tam tez trzeba wyrzucic referencje do projektu
            user.projects.pull(projectId);
            return user.save();
           
        })
        .then(result => {
            //usuwam wszystkie pliki w projekcie danego uzytkownika
            const dirpath = appRoot + '/repo/'+req.userId + '/'+projectId;
            console.log(dirpath)
            rimraf(dirpath, function(err) {
                if (err) {
                    console.log(err);
                    return err;
                } else {
                    console.log("Successfully deleted a user directory");
                }
               
              });

            res.status(200).json({message: 'Project removed!', projectId: projectId})
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