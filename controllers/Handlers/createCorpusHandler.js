const fs = require('fs-extra');
const path = require('path');
const ffmpeg = require('ffmpeg');
const mkdirp = require("mkdirp"); //do tworzenia folderu
const rimraf = require("rimraf");
const appRoot = require('app-root-path'); //zwraca roota aplikacji
const moment = require('moment');
const utils = require('../../utils/utils');
const config = require('../../config.js');
const ProjectEntry = require('../../models/projectEntry');
const Container = require('../../models/Container')
const Session = require('../../models/Session');
const ProjectFile = require('../../models/projectFile');
const User = require('../../models/user');
const IncomingForm = require('formidable').IncomingForm;
const uniqueFilename = require('unique-filename');
const shell = require('shelljs');
const {spawn} = require('child_process');
const chalk = require('chalk');
const emu = require('../emu');
const runTask = require('../runTask');
const archiver = require('archiver');
const zipDirectoryHandler = require('./zipDirectoryHandler')


module.exports = (project) => {
    return new Promise(async (resolve, reject) => {
  
      try{


            const projectId = project._id;
            const userId = project.owner;
  
            // tutaj robie export do EMU tylko tych plików które mają wszystkie narzędzia wykonane
            //przeglądam kontenery tego użytkownika i wybieram tylko te które mogą być zapisane
            //zakładam że eksportuje tylko te pliki które mają wykoną transkrypcje i segmentacje
            let containers = await Container.find({
                owner: userId,
                project: projectId,
                ifVAD: true,
                ifDIA: true,
                ifREC: true,
                ifSEG: true
            }, {
                VADUserSegments: 0,
                DIAUserSegments: 0,
                RECUserSegments: 0,
                SEGUserSegments: 0
            })

  
            const nazwaKorpusu = 'KORPUS';
            const pathToUserProject = appRoot + '/repo/' + userId + '/' + projectId;
            const pathToCorpus = pathToUserProject + '/' + nazwaKorpusu;
            const pathToZIP = pathToCorpus+'.zip';

            
          
            let correctContainers = await emu.containers2EMU(containers);
      
            //teraz tworze folder w katalogu projektu danego usera z gotowym korpusem
            if(!fs.existsSync(pathToCorpus)){
              fs.mkdirSync(pathToCorpus, { recursive: true })
            } 
          
            let oryginalDBconfigPath = appRoot + '/emu/test_DBconfig.json';
            let pathToDBconfig = pathToCorpus + '/' + nazwaKorpusu + '_DBconfig.json';
            
            //teraz kopiuje do niego plik DBconfig.json
            //zamieniam parametr name na nazwe korpusu
            const dbconfig = fs.readJsonSync(oryginalDBconfigPath);
            dbconfig.name = nazwaKorpusu;
            fs.writeJsonSync(pathToDBconfig, dbconfig,{spaces: '\t'});
  
            let promises = [];
                  
            //teraz tworze w tym folderze katalogi z sesjami i kopiuje tam foldery z contenerami
            for (let container of correctContainers){
  
              const audioFileName = container.fileName;
              const containerFolderName = utils.getFileNameWithNoExt(audioFileName);  //np.lektor-fe2e3423 - na serwerze folder
              const projectId = container.project;
              const sessionId = container.session;
              const pathToContainer = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + containerFolderName;
              
              let promis = new Promise(async (resolve, reject) => {
  
                try {

                    const session = await Session.findById(sessionId);
                    const sessionName = session.name;
                    const sessionPath = pathToCorpus + '/' + sessionName + '_ses';
      
                    //tworze katalog sesji jeżeli nie istnieje
                    if(!fs.ensureDirSync(sessionPath)){
                        fs.mkdirSync(sessionPath, { recursive: true })
                    } 
      
                    const containerPath = sessionPath + '/' + containerFolderName + '_bndl';
    
                    //tworze katalog contenera jeżeli nie istnieje
                    if(!fs.ensureDirSync(containerPath)){
                        fs.mkdirSync(containerPath, { recursive: true })
                    } 
      
                    //kopiuje do niego pliki EMU json oraz wav
                    let srcpathToWAV = pathToContainer + '/' + audioFileName;
                    let destpathToWAV = containerPath + '/' + audioFileName;
    
                    let srcpathToEMUjson = pathToContainer + '/' + containerFolderName + '_annot.json';
                    let destpathToEMUjson = containerPath + '/' + containerFolderName + '_annot.json';
      
                    fs.copySync(srcpathToWAV, destpathToWAV);
                    fs.copySync(srcpathToEMUjson, destpathToEMUjson);
                    resolve();
                } catch (error) {
                    reject()
                }
              });
  
              promises.push(promis);
  
            }
  
            await Promise.all(promises)
  
            await zipDirectoryHandler(pathToCorpus,pathToZIP)
  
            fs.removeSync(pathToCorpus);   
            resolve(pathToZIP);     
      
    } catch (error) {
        error.message = error.message || "Błąd tworzenia korpusu";
        error.statusCode = error.statusCode || 500;
        reject(error);
    } 
      
    })
  }


