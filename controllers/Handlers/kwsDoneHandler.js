const appRoot = require('app-root-path'); //zwraca roota aplikacji   
const utils = require('../../utils/utils');
const fs = require('fs-extra');
const chalk = require('chalk');

module.exports = (task, container) => {
    return new Promise(async (resolve, reject) => {

        try {

            const userId = container.owner;
            const projectId = container.project;
            const sessionId = container.session;
    
            const audioFileName = container.fileName;
            const containerFolderName = utils.getFileNameWithNoExt(audioFileName);

            const inputFilePath = task.input;
            const resultFile = task.result;

            const pathToResult = appRoot + '/repo/' + resultFile;

            //przenosze resultaty do katalogu kontenera
            const kwsResultPath = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + containerFolderName + '/' + containerFolderName + '_KWS.txt';
            
            fs.moveSync(pathToResult,kwsResultPath,{overwrite: true});

            //czytam rezultaty rozpoznawania KWS
            var kwsResults = fs.readFileSync(kwsResultPath).toString();

            fs.removeSync(pathToResult);
            fs.removeSync(pathToResult + '_log.txt');

            resolve(kwsResults);


        } catch (error) {
            error.message = "Błąd obsługi wyniku KWS";
            reject(error)
        }

    })
}