const {validationResult} = require('express-validator/check');

//importuje model wpisu projektu
const ProjectEntry = require('../models/projectEntry');

//kontroler do wydobywania listy projektow
exports.getProjectsList = (req, res, next) => {
    res.status(200).json({
        projects: [
            {
                _id: 'p1',
                name: 'Jakiś tytuł projektu Mariusz :)',
                owner: 'You',
                modified: new Date(),
                owner: "idOwnera1",
                accessToRead: [],
                accessToEdit: []
            },
            {
                _id: 'p2',
                name: 'Jakiś tytuł projektu 2 bla bla',
                owner: 'You',
                modified: new Date(),
                owner: "idOwnera1",
                accessToRead: [],
                accessToEdit: []
            },
            {
                _id: 'p3',
                name: 'Jakiś tytuł projektu 3',
                owner: 'You',
                modified: new Date(),
                owner: "idOwnera1",
                accessToRead: [],
                accessToEdit: []
            }
        ]
    })
}


//dodawanie nowego projektu
exports.createProject = (req, res, next) => {

    //resultaty validacji
    const error = validationResult(req);
    if(!error.isEmpty()){
        return res.status(422).json({
            message: 'Validation failed',
            errors: error.array(),
        });
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
            console.log(error);
        })

    
}