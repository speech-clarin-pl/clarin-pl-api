const fs = require('fs');
const path = require('path');

const {validationResult} = require('express-validator/check');

//importuje model wpisu projektu
const ProjectEntry = require('../models/projectEntry');

//kontroler do wydobywania listy projektow
exports.getProjectsList = (req, res, next) => {

    ProjectEntry.find({owner: 'You'}).sort({"createdAt": "desc"})
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

    //tworze nowy wpis w bazie za pomoca modelu
    const projectEntry = new ProjectEntry({
        name: reqProjectName,
        owner: 'You',
        accessToRead: [],
        accessToEdit: []
    });

    //zapisuje do bazy
    projectEntry
        .save()
        .then(entry => {
            console.log(entry);
            res.status(201).json({
                message: 'The project created successfully!',
                project: entry
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

            // TO DO: tutaj sprawdzic czy usuwany post nalezy do zalogowanego usera
            // TO DO: tutaj tez usunac projekt z wszystkimi plikami uzytkownika
            
            //usuwam z bazy ten projektu
            return ProjectEntry.findByIdAndRemove(projectId);
        })
        .then(projectEntry => {
            //rezultat zapisywania do bazy
            res.status(200).json({message: 'Project removed!', projectId: projectEntry._id})
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

    //console.log("updateProjectName");
    //console.log(projectId);
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