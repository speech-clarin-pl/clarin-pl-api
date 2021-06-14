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

module.exports = (task, container) => {
    return new Promise(async (resolve, reject) => {
        try {

            const userId = container.owner;
            const projectId = container.project;
            const sessionId = container.session;

            const audioFileName = container.fileName;       //np. lektor-fe2e3423.wav - na serwerze
            const containerFolderName = utils.getFileNameWithNoExt(audioFileName);  //np.lektor-fe2e3423 - na serwerze folder

            let inputAudioFilePath = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + containerFolderName + '/' + audioFileName;

            //do dockera podaje ścieżke relatywną
            inputAudioFilePath = path.relative(appRoot + '/repo/', inputAudioFilePath);

            const resultFile = task.result;

            // tworze z pliku wynikowego txt odpowiedniego JSONA - na przyszłość
            const pathToResult = appRoot + '/repo/' + resultFile;

            //zapisuje wynik DIA w katalogu containera
            const finalPathToResult = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + containerFolderName + '/' + containerFolderName + '_DIA.ctm';

            //przenosze plik z wynikami do katalogu kontenera
            fs.moveSync(pathToResult, finalPathToResult, { overwrite: true });

            //tutaj konwertuje plik ctm na format jsona aby dal sie czytac przez audio edytor
            //z czegos takiego
            //input 0 0.540 1.875 3
            //input 0 2.415 2.245 2
            //input 0 4.700 1.125 2
            //input 0 5.825 3.000 3
            //input 0 8.825 1.335 1

            //robimy
            // segments: [{
            //     startTime: 1,
            //     endTime: 3,
            //     editable: true,
            //     color: "#ff0000",
            //     labelText: "My label"
            //   },
            //   {
            //     startTime: 5,
            //     endTime: 6,
            //     editable: true,
            //     color: "#00ff00",
            //     labelText: "My Second label"
            //   }],

            //każdy segment jest w osobnej linii
            let segments = [];

            var diaSegment = fs.readFileSync(finalPathToResult).toString().split("\n");

            //iteruje po segmentach
            for (i in diaSegment) {
                const line = diaSegment[i];
                //input 1 0.680 2.060 speech

                //dziele wg spacji
                const info = line.split(" ");
                if (info.length > 4) {

                    const co = info[0];
                    const kto = info[1];
                    const start = info[2];
                    const dlugosc = info[3];
                    const rodzaj = info[4];
                    const segment = {
                        startTime: Number(parseFloat(start).toFixed(2)),
                        endTime: Number((Number(parseFloat(start)) + Number(parseFloat(dlugosc))).toFixed(2)),
                        editable: true,
                        color: '#394b55',
                        labelText: rodzaj,
                    }

                    segments.push(segment);

                }
            }

            // zapisuje plik jako json
            let gdziedot = finalPathToResult.lastIndexOf('.');
            let finalPathToResultJSON = finalPathToResult.substring(0, gdziedot) + '.json';

            //UWAGA!! nie używam go później w kodzie ponieważ te dane wpisuje w baze danych w konener!!
            //ale na wszelki wypadek są też w pliku
            fs.writeJsonSync(finalPathToResultJSON, segments);

            //convertuje na textGrid
            await emu.ctmDIA2tg(container);

            const updatedContainer = await Container.findOneAndUpdate({ _id: container._id }, { ifDIA: true, DIAUserSegments: segments, statusDIA: 'done', errorMessage: '' });

            //teraz usuwam z dysku plik  log
            fs.removeSync(pathToResult + '_log.txt');

            //i usuwam tymczasowy plik txt
            fs.removeSync(pathToResult);

             //testowo
            // const testError = new Error("testowy error diaryzacji");
            // throw testError

            resolve(segments)

           
        } catch (error) {
            error.message = "Wystąpił błąd obsługi diaryzacji";
            reject(error);
        }

    })
}