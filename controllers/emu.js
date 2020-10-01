const {spawn} = require('child_process');
const utils = require('../utils/utils');
const appRoot = require('app-root-path'); //zwraca roota aplikacji  

//###########zamieniam ctm z VAD na textGrid
exports.ctmVAD2tg = (container) => {
    return new Promise((resolve, reject) => {
        
        const containerId = container._id;
        const userId = container.owner;
        const audioFileName = container.fileName;

        const containerFolderName = utils.getFileNameWithNoExt(audioFileName);  //np.lektor-fe2e3423 - na serwerze folder

        const projectId = container.project;
        const sessionId = container.session;
    
        const path2container = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + containerFolderName;
    
        const vadCtmFileName = path2container + '/' + containerFolderName + '_VAD.ctm';
        const vadTextGridFileName = path2container + '/' + containerFolderName + '_VAD.textGrid';

        const ctmVAD_2_tg = spawn('python3', [appRoot + '/emu/convert_ctm_tg.py', vadCtmFileName, vadTextGridFileName]);
    

        
        ctmVAD_2_tg.stdout.on('data', (data) => {
            console.log('Pipe data from python script ...' + data.toString());
        });
    
        ctmVAD_2_tg.on('close', (code) => {
            console.log("konversja ctm VAD 2 tg zakonczona")
            console.log(`child process close all stdio with code ${code}`);
            // 0 cussess, 2 error, 1 cos nie tak z argumentami
            if(code==0){
                resolve();
            } else {
                reject();
            }
        });
    })
}


//###########zamieniam ctm  DIA na textGrid
exports.ctmDIA2tg = (container) => {
    return new Promise((resolve, reject) => {
        const containerId = container._id;
        const userId = container.owner;
        const audioFileName = container.fileName;
        const containerFolderName = utils.getFileNameWithNoExt(audioFileName);  //np.lektor-fe2e3423 - na serwerze folder
        const projectId = container.project;
        const sessionId = container.session;
    
        const path2container = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + containerFolderName;
    
        const diaCtmFileName = path2container + '/' + containerFolderName + '_DIA.ctm';
        const diaTextGridFileName = path2container + '/' + containerFolderName + '_DIA.textGrid';
    
        const ctmDIA_2_tg = spawn('python3', [appRoot + '/emu/convert_ctm_tg.py', diaCtmFileName, diaTextGridFileName]);
    
        ctmDIA_2_tg.on('close', (code) => {
            console.log("konversja ctm DIA 2 tg zakonczona")
            console.log(`child process close all stdio with code ${code}`);
            // 0 cussess, 2 error, 1 cos nie tak z argumentami
            if(code==0){
                resolve();
            } else {
                reject();
            }
        });
    })
}



//###########zamieniam ctm SEG na textGrid
exports.ctmSEG2tg = (container) => {
    return new Promise((resolve, reject) => {
        const containerId = container._id;
        const userId = container.owner;
        const audioFileName = container.fileName;
        const containerFolderName = utils.getFileNameWithNoExt(audioFileName);  //np.lektor-fe2e3423 - na serwerze folder
        const projectId = container.project;
        const sessionId = container.session;
    
        const path2container = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + containerFolderName;
    
        const segCtmFileName = path2container + '/' + containerFolderName + '_SEG.ctm';
        const segTextGridFileName = path2container + '/' + containerFolderName + '_SEG.textGrid';
    
        const ctmalign_2_tg = spawn('python3', [appRoot + '/emu/convert_ctm_tg.py', segCtmFileName, segTextGridFileName]);
    
        ctmalign_2_tg.on('close', (code) => {
            console.log("konversja ctm SEG 2 tg zakonczona")
            console.log(`child process close all stdio with code ${code}`);
            // 0 cussess, 2 error, 1 cos nie tak z argumentami
            if(code==0){
                resolve();
            } else {
                reject();
            }
        });
    })
}

  //########### generuje plik JSCON dla EMU z plikow ctms
exports.ctms2EMU = (container) => {
    return new Promise((resolve, reject) => {
        const containerId = container._id;
        const userId = container.owner;
        const audioFileName = container.fileName;
        const containerFolderName = utils.getFileNameWithNoExt(audioFileName);  //np.lektor-fe2e3423 - na serwerze folder
        const projectId = container.project;
        const sessionId = container.session;
    
        const path2container = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + containerFolderName;
    
        const wavFileName = path2container + '/' + audioFileName;
        const vadCtmFileName = path2container + '/' + containerFolderName + '_VAD.ctm';
        const diaCtmFileName = path2container + '/' + containerFolderName + '_DIA.ctm';
        const segCtmFileName = path2container + '/' + containerFolderName + '_SEG.ctm';
        const JSONOutputFileName = path2container + '/' + containerFolderName + '_annot.json';
  
        const ctms_2_emu = spawn('python3', [appRoot + '/emu/convert_ctms_to_emu.py', 
                                            wavFileName, 
                                            container.containerName,
                                            vadCtmFileName,
                                            diaCtmFileName,
                                            segCtmFileName,
                                            JSONOutputFileName]);

        ctms_2_emu.on('close', (code) => {
            console.log("konversja ctm CTMs 2 JSON zakonczona")
            console.log(`child process close all stdio with code ${code}`);
            // 0 cussess, 2 error, 1 cos nie tak z argumentami
            if(code>0){
                reject(code);
            } else {
                resolve(code);
            }

        });
    })
}



 exports.containers2EMU = (containers) => {

    return new Promise((resolve, reject) => {

        if(containers.length == 0){
            reject("Lista contenerów dla EMU JSCON była pusta");
        }

        let promises = [];

        let correctContainers = [];

        for(let container of containers ){
            let promis = new Promise((resolve, reject) => {
                this.ctms2EMU(container)
                    .then((code)=>{
                        console.log(code)
                        correctContainers.push(container);
                        resolve(code);
                    })
                    .catch((code) => {
                        reject(code)
                    })
            });
    
            promises.push(promis);
        }
    
        Promise.all(promises)
            .then(result => {
                resolve(correctContainers)
            })
            .catch(err=>{
                //zawsze robie resolve ponieważ chce sprawdzić które kontenery się nie wykonały
                //wtedy correntContainers zawieraja tylko te którym udało się zrobić EMU JSON
                resolve(correctContainers)
            })
    });
}

