//importuje model wpisu projektu
const appRoot = require('app-root-path'); //zwraca roota aplikacji   
const utils = require('../../utils/utils');
const fs = require('fs-extra');
const Container = require('../../models/Container');
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

            // tworze z pliku wynikowego txt odpowiedniego JSONA - na przyszłość
            const pathToResult = appRoot + '/repo/' + resultFile;
            const JSONtranscription = utils.convertTxtFileIntoJSON(pathToResult);

            //zapisuje tego JSONA w katalogu containera
            const JSONTransPath = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + containerFolderName + '/' + containerFolderName + '.json';

            await fs.writeJson(JSONTransPath, JSONtranscription);

            //aktualizuje flage w kontenrze
            const updatedContainer = await Container.findOneAndUpdate({ _id: container._id },
                { ifREC: true, statusREC: 'done', errorMessage: '' }, { new: true });

            const TXTTransPath = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + containerFolderName + '/' + containerFolderName + '_TXT.txt';

            // musze stworzyć tymczasowo plik txt którego zawartość wyciągam z jsona
            let txtContent = utils.convertJSONFileIntoTXT(JSONTransPath);

            // zapisuje ten plik jako surowy txt aby docker mial do niego dostep
            fs.writeFileSync(TXTTransPath, txtContent);

            fs.removeSync(pathToResult);
            fs.removeSync(pathToResult + '_log.txt');

            resolve(updatedContainer);


        } catch (error) {
            error.message = "Błąd obsługi wyniku rozpoznawania";
            reject(error)
        }

    })
}