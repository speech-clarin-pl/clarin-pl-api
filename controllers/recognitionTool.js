const appRoot = require('app-root-path'); //zwraca roota aplikacji    
const fs = require('fs-extra');
const ProjectEntry = require('../models/projectEntry');
const ProjectFile = require('../models/projectFile');
const User = require('../models/user');
const utils = require('../utils/utils');
const ffmpeg = require('ffmpeg');
const Container = require('../models/Container');
const chalk = require('chalk');

// refactored
exports.saveTranscription = async (req, res, next) => {

    try {

        const transcription = req.body.transcription;


        if (!transcription) {
            const error = new Error('Brak transkrypcji do zapisania');
            error.statusCode = 400;
            throw error;
        }

        const container = await Container.findById(req.body.container._id);

        if (!container) {
            const error = new Error('Brak informacji o kontenerze');
            error.statusCode = 400;
            throw error;
        }


        //sprawdzam czy mamy uprawnienia
        const userToCheck = await User.findById(container.owner,"_id status");
        if ((userToCheck._id.toString() !== req.userId.toString()) || (userToCheck.status.toString() !== "Active")) {
            const error = new Error('Nie masz uprawnień!');
            error.statusCode = 403;
            throw error;
        }

        const userId = container.owner;
        const projectId = container.project;
        const sessionId = container.session;

        const containerName = utils.getFileNameWithNoExt(container.fileName);
        const transfFileNameJSON = utils.getFileNameWithNoExt(container.fileName) + '.json';
        const transfFileNameTXT = utils.getFileNameWithNoExt(container.fileName) + '_TXT.txt';

        const transfPathJSON = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + containerName + '/' + transfFileNameJSON;
        const transfPathTXT = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + containerName + '/' + transfFileNameTXT;

        //tymczasowy template do zapisania jako JSON - w przyszłości do zmiany na coś lepszego
        //ten template można jednak rozbudować o dodatkowe bloki
        let toSaveTemplate = {
            "blocks": [
                {
                    "starttime": 123456,
                    "stoptime": 124556,
                    "data": {
                        "text": transcription,
                        "type": "speech"
                    }
                }
            ]
        }


        //zapisuje JSONa i TXT (dla ewentualnej Segmentacji)
        fs.writeJsonSync(transfPathJSON, toSaveTemplate);
        fs.outputFileSync(transfPathTXT,transcription);
        

        //zapisuje update do bazy danych
        await Container.findByIdAndUpdate(req.body.container._id,{ifREC: true});
        res.status(201).json({ message: 'transcrypcja została zapisana!' });

    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        error.message = "Błąd zapisywania transkrypcji"
        next(error);
    }
}

// refactored
exports.loadTranscription = async (req, res, next) => {

    try {
        const containerId = req.params.containerId;

        if (!containerId) {
            const error = new Error('Brak id kontenera');
            error.statusCode = 400;
            throw error;
        }

        const container = await Container.findById(containerId);

        const userId = container.owner;
        const projectId = container.project;
        const sessionId = container.session;

        //sprawdzam czy mam uprawnienia
        if(userId.toString() !== req.userId.toString()){
            const error = new Error('Nie masz uprawnień');
            error.statusCode = 403;
            throw error;
        }

        //wydobywam i czytam plik json
        const containerName = utils.getFileNameWithNoExt(container.fileName);
        const transfFileName = utils.getFileNameWithNoExt(container.fileName) + '.json';

        const jsonpath = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + containerName + '/' + transfFileName;

        const packageObj = fs.readJsonSync(jsonpath);

        res.status(201).json(packageObj);


    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        error.message = "Błąd ładowania transkrypcji"
        next(error);
    }

}
