//importuje model wpisu projektu
const Task = require('../../models/DockerTask');
const appRoot = require('app-root-path'); //zwraca roota aplikacji   
const utils = require('../../utils/utils');
const moment = require('moment');
const fs = require('fs-extra');
const ProjectEntry = require('../../models/projectEntry');
const ProjectFile = require('../../models/projectFile');
const User = require('../../models/user');
const Container = require('../../models/Container');
const path = require('path');
const emu = require('../emu');
const chalk = require('chalk');

module.exports = (task, userId) => {
    return new Promise(async (resolve, reject) => {

        try {

            const userId = userId;


            const inputFilePath = task.input;
            const resultFile = task.result;

            const pathToResult = appRoot + '/repo/' + resultFile;

            //przenosze resultaty do katalogu kontenera
            const g2pResultPath = appRoot + '/repo/' + userId +'/' + userId + '_G2P.txt';
            
            fs.moveSync(pathToResult,g2pResultPath,{overwrite: true});

            //czytam rezultaty rozpoznawania KWS
            var g2pResults = fs.readFileSync(g2pResultPath).toString();

            fs.removeSync(pathToResult);
            fs.removeSync(pathToResult + '_log.txt');

            resolve(g2pResults);


        } catch (error) {
            error.message = "Błąd obsługi wyniku G2P";
            reject(error)
        }

    })
}