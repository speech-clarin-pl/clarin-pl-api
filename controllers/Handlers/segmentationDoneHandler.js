//importuje model wpisu projektu
const appRoot = require('app-root-path'); //zwraca roota aplikacji   
const utils = require('../../utils/utils');

const fs = require('fs-extra');
const Container = require('../../models/Container');
const emu = require('../emu');
const chalk = require('chalk');

module.exports = (task, container) => {
    return new Promise(async (resolve, reject) => {
        try {
            const userId = container.owner;
            const projectId = container.project;
            const sessionId = container.session;

            const audioFileName = container.fileName;       //np. lektor-fe2e3423.wav - na serwerze
            const containerFolderName = utils.getFileNameWithNoExt(audioFileName);  //np.lektor-fe2e3423 - na serwerze folder

            const pathToContainer = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + containerFolderName;

            const resultFile = task.result;
            const pathToResult = appRoot + '/repo/' + resultFile;

            //zapisuje wynik w katalogu containera
            const finalPathToResult = pathToContainer + '/' + containerFolderName + '_SEG.ctm';

            //przenosze plik z wynikami do katalogu kontenera
            fs.moveSync(pathToResult, finalPathToResult, { overwrite: true });
            //convertuje na textGrid
            await emu.ctmSEG2tg(container);

            const updatedContainer = await Container.findOneAndUpdate({ _id: container._id }, { ifSEG: true, statusSEG: 'done', errorMessage: '' }, { new: true });
            //teraz usuwam z dysku plik  log
            fs.removeSync(pathToResult + '_log.txt');

            let returnData = {
                updatedContainer: updatedContainer,
            };

            resolve(returnData)
        } catch (error) {
            error.message = "Błąd obsługi wyników segmentacji"
            reject (error)
        }

    })
}