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
        
            //sciezka do pliku relatywna dla dockera
            let inputAudioFilePath = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + containerFolderName + '/' + audioFileName;
            inputAudioFilePath = path.relative(appRoot + '/repo/', inputAudioFilePath);

            const inputFilePath = task.input;
            const resultFile = task.result;

            // tworze z pliku wynikowego txt odpowiedniego JSONA - na przyszłość
            const pathToResult = appRoot + '/repo/' + resultFile;

            //zapisuje wynik VAD w katalogu containera
            const finalPathToResult = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + containerFolderName + '/' + containerFolderName + '_VAD.ctm';

            //przenosze plik z wynikami do katalogu kontenera

            fs.moveSync(pathToResult, finalPathToResult,{overwrite: true});

            let segments = [];
            var vadSegment = fs.readFileSync(finalPathToResult).toString().split("\n");

            //iteruje po segmentach
            for(i in vadSegment) {
                const line = vadSegment[i];
                //input 1 0.680 2.060 speech

                //dziele wg spacji
                const info = line.split(" ");
                if(info.length > 4){

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
            let finalPathToResultJSON = finalPathToResult.substring(0,gdziedot) + '.json';

            //UWAGA!!  te dane wpisuje w baze danych w konener!!
            fs.writeJsonSync(finalPathToResultJSON, segments);

            const ctmres = await emu.ctmVAD2tg(container);
            const updatedContainer = await Container.findOneAndUpdate(
                {_id: container._id},
                {ifVAD: true, VADUserSegments: segments, statusVAD: 'done',errorMessage:''},
                {new: true}
                );

            //teraz usuwam z dysku plik  log
            fs.removeSync(pathToResult+'_log.txt');
            //i usuwam tymczasowy plik txt
            fs.removeSync(pathToResult);

            //testowo
            // const testError = new Error("testowy error");
            // throw testError

            resolve(segments);

        } catch (error) {
            error.message = "Błąd obsługi detekcji mowy";
            reject(error)
        }

    })
}