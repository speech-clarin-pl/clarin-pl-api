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

const createProjectHandler = require('../controllers/Handlers/createProjectHandler');

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







/**
 * @api {post} /projectsList/addProject Tworzenie Projektu
 * @apiDescription Tworzenie nowego projektu na potrzeby budowy nowego korpusu. Pliki w projekcie zorganizowane są w sesje. Podczas tworzenia projektu, tworzona jest domyślna sesja oraz sesja demo z przykładowymi plikami.
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
 *     HTTP/1.1 201 OK
 *     {
 *       "message": 'Projekt został utworzony!',
 *       "project": { accessToRead: [],
 *                         accessToEdit: [],
 *                         sessionIds: ["5fec2f1082a28b3663a90845", "5fec2f1082a28b3663a90846"],
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

// refactored
// #################################################################################
// ################### dodawanie nowego projektu ##################################
// #################################################################################

exports.createProject = async (req, res, next) => {

    const reqProjectName = req.body.projectName;

    if(!reqProjectName){
        const error = new Error('Brak nazwy projektu');
        error.statusCode = 400;
        throw error;
    }
    

    //osoba musi być zalogowana
    const owner = req.userId;

    if(owner){
        const error = validationResult(req);
        if(!error.isEmpty()){
            console.log(chalk.red(error.array()))
            const errortothrow = new Error('Błąd walidacji');
            errortothrow.statusCode = 422;
            throw errortothrow;
        }
        
        const results = await createProjectHandler(reqProjectName, owner);

        res.status(201).json({message: 'Projekt został utworzony!', project: results.project});
        
    } else {
        const err = new Error('Nie masz uprawnień');
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

// refactored
// #################################################################################
// ################### usuwanie projektu ###########################################
// #################################################################################
exports.deleteProject = async (req,res,next) => {

    try {

        const projectId = req.params.projectId;

        if(!projectId){
            const error = new Error('Błądny parametr id projektu');
            error.statusCode = 400;
            throw error;
        }

        //znajduje projekt w bazie
        const projectEntry = await ProjectEntry.findById(projectId);

        if(!projectEntry){
            const error = new Error('Nie znaleziono projektu o zadanym id');
            error.statusCode = 404;
            throw error;
        }

        //sprawdzam czy usuwania dokonuje zalogowana osoba
        if(projectEntry.owner.toString() !== req.userId.toString()){
            const error = new Error('Nie masz uprawnień!');
            error.statusCode = 403;
            throw error;
        }
        
        //usuwam z bazy ten projekt
        const projectToDelete = await ProjectEntry.findByIdAndRemove(projectId);

         //czyszcze relacje z kolekcja usera- tam tez trzeba wyrzucic referencje do projektu
         const updatedUser = await User.findByIdAndUpdate(req.userId, {$pull: {projects: projectId}});

         //usuwam z kolekcji sessions
         const removedSessions = await Session.deleteMany({_id: projectToDelete.sessionIds});

         //usuwam kontenery nalezace do projektu
         const removedContainers = await Container.deleteMany({project: projectToDelete._id});

         //usuwam wszystkie pliki w projekcie danego uzytkownika
         const dirpath = appRoot + '/repo/'+req.userId + '/'+projectId;

         rimraf.sync(dirpath);

         res.status(200).json({message: 'Projekt usunięty!', projectId: projectId})

    } catch (error) {
        if(!error.statusCode){
            error.statusCode = 500;
        }
        error.message = "Błąd usuwania projektu"
        next(error);
    }

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


//refactored
// ############################################################################
// ################### edycja nazwy projektu ##################################
// ############################################################################

exports.updateProjectName = async (req, res, next) => {

    try {

        const error = validationResult(req);
        if (!error.isEmpty()) {
            const error = new Error('Błąd walidacji');
            error.statusCode = 422;
            throw error;
        }

        const projectId = req.params.projectId;
        const newprojectName = req.body.newProjectName;

        if (!projectId) {
            const error = new Error('Błądny parametr id projektu');
            error.statusCode = 400;
            throw error;
        }

        const projectEntry = await ProjectEntry.findById(projectId);

        if (!projectEntry) {
            const error = new Error('Nie znaleziono projektu');
            error.statusCode = 404;
            throw error;
        }

        //sprawdzam czy updatu dokonuje zalogowana osoba
        if (projectEntry.owner.toString() !== req.userId.toString()) {
            const error = new Error('Not authorized!');
            error.statusCode = 403;
            throw error;
        }

        //zapisuje do bazy update
        projectEntry.name = newprojectName;
        await projectEntry.save();

        res.status(200).json({ message: 'Nazwa projektu zaktualizowana!', projectId: projectEntry._id, newName: newprojectName })

    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        error.message = "Błąd aktualizacji nazwy projektu"
        next(error);
    }
}
