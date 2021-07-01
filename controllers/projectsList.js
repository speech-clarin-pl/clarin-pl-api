const {validationResult} = require('express-validator/check');
const ProjectEntry = require('../models/projectEntry');
const Container = require('../models/Container')
const User = require('../models/user');
const chalk = require('chalk');
var rimraf = require("rimraf"); 
var appRoot = require('app-root-path'); //zwraca roota aplikacji
const Session = require('../models/Session');
const createProjectHandler = require('../controllers/Handlers/createProjectHandler');


/**
 * @api {get} /projectsList Pobranie listy projektów
 * @apiDescription Zwraca listę projektów stworzonych przez zalogowanego użytkownika
 * @apiName GetProjectList
 * @apiGroup Pliki
 *
 * @apiHeader {String} Authorization Ciąg znaków 'Bearer token' gdzie w miejsce 'token' należy wstawić token uzyskany podczas logowania.
 * @apiSuccess {String} message wiadomość że projekt został utworzony.
 * @apiSuccess {Object} projects tablica z metadanymi projektów użytkownika
 * 
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *    "message": "Lista projektów pobrana!",
 *    "projects": [
 *        {
 *            "sessionIds": [
 *                "60dde3c32c7c40e8baedcaf2",
 *                "60dde3c32c7c40e8baedcaf3"
 *            ],
 *            "_id": "60dde3c32c7c40e8baedcaf1",
 *            "name": "Zmieniona nazwa nowego projektu XYZ",
 *            "owner": "60ddca14f2e04bbdec0aa893",
 *            "projectCreated": "July 1st 2021, 5:48:19 pm",
 *            "createdAt": "2021-07-01T15:48:19.874Z",
 *            "updatedAt": "2021-07-01T15:54:08.572Z",
 *        },
 *        {
 *            "sessionIds": [
 *                "60ddca1bf2e04bbdec0aa896",
 *                "60ddca1bf2e04bbdec0aa897"
 *            ],
 *            "_id": "60ddca1bf2e04bbdec0aa894",
 *            "name": "DOMYŚLNY PROJEKT",
 *            "owner": "60ddca14f2e04bbdec0aa893",
 *            "projectCreated": "July 1st 2021, 3:58:51 pm",
 *            "createdAt": "2021-07-01T13:58:51.766Z",
 *            "updatedAt": "2021-07-01T13:58:51.776Z",
 *        }
 *    ]
 *}
 *
 * @apiError (500) InternalServerError Błąd serwera
 * 
 */


//refactoredOK
//kontroler do wydobywania listy projektow
exports.getProjectsList = async (req, res, next) => {

    try{

        const projectsList = await ProjectEntry.find({owner: req.userId}).sort({"createdAt": "desc"});

        res.status(200).json({message: 'Lista projektów pobrana!', projects: projectsList})

    } catch (error) {
        error.statusCode = error.statusCode || 500;
        error.message = error.message || "Błąd zwracania listy projektów";
        next(error);
    }
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
 *       "project": { 
 *                    sessionIds: ["5fec2f1082a28b3663a90845", "5fec2f1082a28b3663a90846"],
 *                    _id: 5fe99be5d831b7c009e36fbb,
 *                    name: 'sampleProject',
 *                    owner: 5fe39a36daa13f1fa38e1e06,
 *                    projectCreated: 'December 28th 2020, 9:48:37 am',
 *                    createdAt: 2020-12-28T08:48:37.558Z,
 *                    updatedAt: 2020-12-28T08:48:37.558Z,
 *          
 *                  }
 *     }
 *
 * @apiError (422) ValidationFailed Błędna nazwa projektu
 * @apiError (400) BadRequest Błedne polecenie
 * 
 */

// refactoredOK
// #################################################################################
// ################### dodawanie nowego projektu ##################################
// #################################################################################

exports.createProject = async (req, res, next) => {

    try {
        const reqProjectName = req.body.projectName;

        if(!reqProjectName){
            const error = new Error('Brak nazwy projektu');
            error.statusCode = 400;
            throw error;
        }
        
        const error = validationResult(req);
        if(!error.isEmpty()){
            console.log(chalk.red(error.array()))
            const errortothrow = new Error('Błąd walidacji');
            errortothrow.statusCode = 422;
            throw errortothrow;
        }
        
        const results = await createProjectHandler(reqProjectName, req.userId);
    
        res.status(201).json({message: 'Projekt został utworzony!', project: results.project});

    } catch (error) {
        error.statusCode = error.statusCode || 500;
        error.message = error.message || "Błąd tworzenia projektu";
        next(error);
    }  
}


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
 * @apiError (404) NotFound Nie znaleziono projektu o zadanym Id
 * @apiError (403) Forbidden Brak uprawnień
 * @apiError (400) BadRequest Nie znaleziono projektu o zadanym Id
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

        //sprawdzam czy mam Uprawnienia do swojego projektu
        await projectEntry.checkPermission(req.userId);
        
        //usuwam z bazy ten projekt
        const projectToDelete = await ProjectEntry.findByIdAndRemove(projectId);

         //czyszcze relacje z kolekcja usera- tam tez trzeba wyrzucic referencje do projektu
         await User.findByIdAndUpdate(req.userId, {$pull: {projects: projectId}});

         //usuwam z kolekcji sessions
        await Session.deleteMany({_id: projectToDelete.sessionIds});

         //usuwam kontenery nalezace do projektu
         await Container.deleteMany({project: projectToDelete._id});

         //usuwam wszystkie pliki w projekcie danego uzytkownika
         const dirpath = appRoot + '/repo/'+req.userId + '/'+projectId;

         rimraf.sync(dirpath);

         res.status(200).json({message: 'Projekt usunięty!', projectId: projectId})

    } catch (error) {
        error.statusCode = error.statusCode || 500;
        error.message = error.message || "Błąd usuwania projektu";
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
 *       "projectId": '5fe99be5d831b7c009e36fbb',
 *       "newName": 'nowa nazwa projektu'
 *     }
 *
 * @apiError (422) UnprocessableEntity Błędna nazwa projektu
 * @apiError (403) Forbidden Brak uprawnień
 * @apiError (404) NotFound Nie znaleziono projektu
 * @apiError (400) BadRequest Błędne Id projektu
 * 
 * 
 */


//refactoredOK
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

        await projectEntry.checkPermission(req.userId);
       

        //zapisuje do bazy update
        projectEntry.name = newprojectName;
        await projectEntry.save();

        res.status(200).json({ message: 'Nazwa projektu zaktualizowana!', projectId: projectEntry._id, newName: newprojectName })

    } catch (error) {
        error.statusCode = error.statusCode || 500;
        error.message = error.message || "Błąd aktualizacji nazwy projektu";
        next(error);
    }
}
