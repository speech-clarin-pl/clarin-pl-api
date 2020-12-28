const fs = require('fs-extra');
const path = require('path');
const ffmpeg = require('ffmpeg');

const mkdirp = require("mkdirp"); //do tworzenia folderu
const rimraf = require("rimraf");
const appRoot = require('app-root-path'); //zwraca roota aplikacji
const moment = require('moment');
const utils = require('../utils/utils');
const config = require('../config.js');
const ProjectEntry = require('../models/projectEntry');
const Container = require('../models/Container')
const Session = require('../models/Session');
const ProjectFile = require('../models/projectFile');
const User = require('../models/user');
const IncomingForm = require('formidable').IncomingForm;
const uniqueFilename = require('unique-filename');
const shell = require('shelljs');
const {spawn} = require('child_process');
const chalk = require('chalk');

//const AdmZip = require('adm-zip');

const emu = require('./emu');

const runTask = require('./runTask');

const archiver = require('archiver');


//##########################################
//#### Eksportuje do emu ######
//#######################################

exports.zipDirectory = (source, out) => {
  const archive = archiver('zip', { zlib: { level: 9 }});
  const stream = fs.createWriteStream(out);

  return new Promise((resolve, reject) => {
    archive
      .directory(source, false)
      .on('error', err => reject(err))
      .pipe(stream)
    ;

    stream.on('close', () => resolve());
    archive.finalize();
  });
}


exports.createKorpus = (projectId, userId) => {
  return new Promise((resolve, reject) => {
  
    // tutaj robie export do EMU tylko tych plików które mają wszystkie narzędzia wykonane
    //przeglądam kontenery tego użytkownika i wybieram tylko te które mogą być zapisane
    Container.find({owner: userId, project: projectId, ifVAD: true, ifDIA: true, ifREC: true, ifSEG: true },
                    {VADUserSegments:0, DIAUserSegments:0,RECUserSegments:0,SEGUserSegments:0})
      .then(containers => {

        const nazwaKorpusu = 'KORPUS';
        const pathToUserProject = appRoot + '/repo/' + userId + '/' + projectId;
        const pathToCorpus = pathToUserProject + '/' + nazwaKorpusu;
        const pathToZIP = pathToCorpus+'.zip';
  
        emu.containers2EMU(containers)
          .then(correctContainers=>{
  
            //console.log("Folder do CORPUSU: " +  pathToCorpus);
  
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
            //fs.copySync(oryginalDBconfigPath, pathToDBconfig);

            let promises = [];
           
            //teraz tworze w tym folderze katalogi z sesjami i kopiuje tam foldery z contenerami
            for (let container of correctContainers){
              const audioFileName = container.fileName;
              const containerFolderName = utils.getFileNameWithNoExt(audioFileName);  //np.lektor-fe2e3423 - na serwerze folder
              const projectId = container.project;
              const sessionId = container.session;
              const pathToContainer = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + containerFolderName;
              
              let promis = new Promise((resolve, reject) => {
                Session.findById(sessionId)
                .then(session=>{
  
                  const sessionName = session.name;
                  const sessionPath = pathToCorpus + '/' + sessionName + '_ses';
  
                  console.log("tworze sesje: " + sessionPath)
                  //tworze katalog sesji jeżeli nie istnieje
                  if(!fs.ensureDirSync(sessionPath)){
                    console.log("stworzyłem sesje: " + sessionPath)
                    fs.mkdirSync(sessionPath, { recursive: true })
                  } 
  
  
                  const containerPath = sessionPath + '/' + containerFolderName + '_bndl';
                  //tworze katalog contenera jeżeli nie istnieje
                  if(!fs.ensureDirSync(containerPath)){
                    console.log("stworzyłem container folder: " + containerPath)
                    fs.mkdirSync(containerPath, { recursive: true })
                  } 
  
                  //kopiuje do niego pliki EMU json oraz wav
  
                  let srcpathToWAV = pathToContainer + '/' + audioFileName;
                  let destpathToWAV = containerPath + '/' + audioFileName;
  
                  let srcpathToEMUjson = pathToContainer + '/' + containerFolderName + '_annot.json';
                  let destpathToEMUjson = containerPath + '/' + containerFolderName + '_annot.json';
  
                  try{
                    fs.copySync(srcpathToWAV, destpathToWAV);
                    fs.copySync(srcpathToEMUjson, destpathToEMUjson);
                    resolve();
                  } catch(error) {
                    reject();
                  }
  
                }).catch(error=>{
                  console.error(error)
                })
              });
              promises.push(promis);
            }


            Promise.all(promises)
            .then(result => {
                  this.zipDirectory(pathToCorpus,pathToZIP)
                  .then(()=>{
                    fs.removeSync(pathToCorpus);
                    resolve(pathToZIP);
                  })
                  .catch((error)=>{
                    reject(error);
                  })
            })
            .catch(err=>{
              resolve(pathToZIP);
            })
          })
          .catch(error=>{   
            console.error(error)
            
            reject(error);
          })     
      })
  })
}


/**
 * @api {get} /repoFiles/createCorpus/:projectId Tworzenie korpusu
 * @apiDescription Wywołanie powoduje inicjalizację procesu tworzenia korpusu w formacie EMU-SDMS i zapisuje go na serwerze w postaci pliku ZIP. Korpus jest tworzony z plików dla których wykonane zostały wszystkie poziomy anotacji (VAD, DIA, REC oraz SEG). Proces może trać dłuższy czas w zależności od ilości plików w projekcie. Po zakończeniu możesz ściągnąć korpus za pomocą osobnego zapytania API. W trakcie jego tworzenia możesz również odpytać czy korpus dla danego projektu został zakończony.
 * @apiName CreateCorpus
 * @apiGroup Pliki
 *
 * @apiParam {String} projectId Identyfikator projektu dla którego tworzony jest korpus. Możesz go odnaleźć w interfejsie użytkownika bądź skorzystać z domyślnego projektu którego ID jest zwracane podczas rejestracji.
 * @apiHeader {String} Authorization Ciąg znaków 'Bearer token' gdzie w miejsce 'token' należy wstawić token uzyskany podczas logowania.
 * @apiSuccess {String} message wiadomość że korpus został utworzony i możesz go ściągnąć.
 * 
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "message": 'Tworzenie korpusu zakończone sukcesem. Możesz go ściągnąć.',
 *     }
 *
 * @apiError (204) NoContent Twoje pliki nie zawierają wszystkich poziomów anotacji lub coś poszło nie tak na serwerze 
 * 
 * 
 */
exports.exportToEmu = (req, res, next) => {

  const projectId = req.params.projectId;
  
  //const userId = req.params.userId;
  const userId = req.userId;

  ProjectEntry.findById(projectId).then(foundProject => {

    if(!foundProject){
      const wrongProjIDErr = new Error("Nie znaleziono projektu o danym ID");
      throw wrongProjIDErr
    }

    this.createKorpus(projectId, userId)
    .then((pathToZIP)=>{
      console.log(chalk.green("ZIP stworzony: " + pathToZIP))
     // res.sendFile(pathToZIP)
     // res.download(pathToZIP, 'readyZIP.zip');
      res.status(200).json({ message: 'Tworzenie korpusu zakończone sukcesem. Możesz go ściągnąć.'});
      //res.status(200).json({ message: 'ZIP created successfuly!'});
    })
    .catch((error)=>{
      //res.status(204).json({ message: 'Twoje pliki nie zawierają wszystkich poziomów anotacji lub coś poszło nie tak na serwerze'});
      throw error
    }) 


  }).catch(error=>{
    console.log(chalk.red(error.message))
    next(error);
  })

  
}


/**
 * @api {get} /repoFiles/downloadCorpus/:projectId Pobierz korpus EMU
 * @apiDescription Gdy korpus jest stworzony, możesz go pobrać na dysk twardy
 * @apiName DownloadCorpus
 * @apiGroup Pliki
 *
 * @apiParam {String} projectId Identyfikator projektu dla którego chcesz pobrać korpus. Znajdziesz go również w interfejsie użytkownika.
 * @apiHeader {String} Authorization Ciąg znaków 'Bearer token' gdzie w miejsce 'token' należy wstawić token uzyskany podczas logowania.
 *
 * @apiSuccess {Object} korpus w formacie ZIP
 * 
 * @apiError (404) NotFound nie znaleziono projektu o danym ID 
 * @apiError (500) ServerError 
 */

// ###################################################
// ########### pobieram gotowy korpus
// ######################################################

exports.getReadyKorpus = (req,res,next) => {

  const userId = req.userId;
  const projectId = req.params.projectId;

  ProjectEntry.findById(projectId)
    .then(foundPE => {
      if(!foundPE){
        const error = new Error('Nie znaleziono projektu o danym ID');
        error.statusCode = 404;
        throw error;
      }

      const nazwaKorpusu = 'KORPUS';
      const pathToUserProject = appRoot + '/repo/' + userId + '/' + projectId;
      const pathToCorpus = pathToUserProject + '/' + nazwaKorpusu;
      const pathToZIP = pathToCorpus+'.zip';

      try {
        if(fs.existsSync(pathToZIP)) {
          res.download(pathToZIP,(nazwaKorpusu+'.zip'));
        } else {
          const corpusNotCreatedErr = new Error("Dla tego projektu nie został wygenerowany korpus");
          throw corpusNotCreatedErr;
        }
      } catch (err) {
         throw err;
      }
       
      

    }).catch(error=>{
      console.log(chalk.red(error.message));
      error.statusCode = error.statusCode || 500;
      next(error);
    })
 }



/**
 * @api {put} /repoFiles/changeContainerName/:containerId' Zmiana nazwy kontenera
 * @apiDescription Zmienia nazwę kontenera 
 * @apiName ChangeContainerName
 * @apiGroup Pliki
 *
 * @apiParam {String} containerId Identyfikator kontenera
 * @apiParam {String} newName Nowa nazwa
 * @apiHeader {String} Authorization Ciąg znaków 'Bearer token' gdzie w miejsce 'token' należy wstawić token uzyskany podczas logowania.
 *
 * @apiSuccess {containerId} Identyfikator kontenera
 * @apiSuccess {newName} Nowa nazwa
 * 
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "message": 'Zmiana nazwy zakończona sukcesem!',
 *       "containerId": "5f58a92dfa006c8aed96f846",
 *       "newName": "Nowa Nazwa",
 *     }
 *
 * 
 * @apiError (500) ServerError 
 */

//##########################################
//#### zmieniam nazwe contenera ######
//#######################################

exports.changeContainerName = (req, res, next) => {
  //const projectId = req.params.projectId;
  const containerId = req.params.containerId;
  const newName = req.body.newName;

  let owner = null;
  Container.findById(containerId).then(foundContainer=>{

    owner = foundContainer.owner;
    return owner;
  }).then(owner => {
    return User.findById(owner);
  }).then(user=>{
    //zabezpieczenie....
    if((user._id+"") == (owner+"")){
      Container.findByIdAndUpdate(containerId,{containerName: newName}).then(container => {
        res.status(200).json({message: 'Zmiana nazwy zakończona sukcesem!', containerId: container._id, newName: newName});
      }).catch(error =>{
        throw error;
      })
    }
  }).catch(error=>{
    console.log(chalk.red(error.message));
    error.statusCode = error.statusCode || 500;
    next(error)
  });
}




/**
 * @api {put} /repoFiles/runSpeechVAD/:containerId Detekcja mowy
 * @apiDescription Narzędzie detekcji mowy. Po wykonaniu zapytania należy poczekać na zakończenie pracy. Po zakończeniu serwer zapisze rezultaty w kontenerze. Aby ściągnąć rezultaty działania narzędzia należy skorzystać z osobnego zapytania API. W międzyczasie możesz odpytywać serwer na temat statusu wykonania tego narzędzia korzystając z containerId w osobnym zapytaniu API.
 * @apiName VADTool
 * @apiGroup Narzędzia
 *
  * @apiParam {String} containerId Identyfikator zasobu. Możesz go również znaleźć w graficznym interfejsie użytkownika
 * @apiHeader {String} Authorization Ciąg znaków 'Bearer token' gdzie w miejsce 'token' należy wstawić token uzyskany podczas logowania.
 *
 * @apiSuccess {String} message informacja o zakończeniu działania
 * @apiSuccess {String} containerId  Identyfikator zasobu
 * @apiSuccess {String} toolType  zwraca flagę "VAD"  
 * @apiSuccess {Object} VADSegments zwraca segmenty detekcji w postaci JSON. Aby pobrać wynik w innym formacie (CTM lub TextGrid) należy skorzystać z osobnego zapytania API.
 * 
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "message": 'Zakończono detekcję mowy!',
 *       "containerId": "5f58a92dfa006c8aed96f846",
 *       "toolType": "VAD",
 *       "VADSegments": [
 *                          {
 *                              "startTime":0.68,
 *                              "endTime":2.74,
 *                              "editable":true,
 *                              "color":"#394b55",
 *                              "labelText":"speech"
 *                          },
 *                          {
 *                              "startTime":2.74,
 *                              "endTime":5.97,
 *                              "editable":true,
 *                              "color":"#394b55",
 *                              "labelText":"speech"
 *                          }
 *                        ]
 *     }
 *
 * @apiError (503) ServiceUnavailable Gdy coś pójdzie nie tak z usługą
 * @apiError (500) ServerError 
 * 
 * 
 */

exports.runSpeechVAD = (req, res, next) => {
  let containerId = req.params.containerId;
  //const toolType = req.body.toolType;

  Container.findById(containerId).then(container => {  
    runTask.runVAD(container)
      .then(VADsegments => {
        console.log(chalk.green("Zakończono VAD dla: " + containerId));
        res.status(200).json({ message: 'Zakończono detekcję mowy!', containerId: containerId, toolType: "VAD", VADSegments: VADsegments});
      }).catch(error => {
        console.log(chalk.red('TASK ERROR'));
        console.log(chalk.red(error.message))
        res.status(503).json({ message: 'Coś poszło nie tak z detekcją mowy!', containerId: containerId, toolType: "VAD"});
      })
  }).catch(error => {
    console.log(chalk.red(error.message));
    error.statusCode = error.statusCode || 500;
    next(error);
  })
}



/**
 * @api {put} /repoFiles/runSpeechDiarization/:containerId Diaryzacja
 * @apiDescription Narzędzie diaryzacji. Po wykonaniu zapytania należy poczekać na zakończenie pracy. Po zakończeniu serwer zapisze rezultaty w kontenerze o danym ID. Aby ściągnąć rezultaty działania narzędzia należy skorzystać z osobnego zapytania API. W międzyczasie możesz odpytywać serwer na temat statusu wykonania tego narzędzia wykorzystując containerId w osobnym zapytaniu API.
 * 
 * @apiName DIATool
 * @apiGroup Narzędzia
 *
 * @apiParam {String} containerId Identyfikator zasobu. Możesz go również znaleźć w graficznym interfejsie użytkownika
 * @apiHeader {String} Authorization Ciąg znaków 'Bearer token' gdzie w miejsce 'token' należy wstawić token uzyskany podczas logowania.
 *
 * @apiSuccess {String} message informacja o zakończeniu działania
 * @apiSuccess {String} containerId  Identyfikator zasobu
 * @apiSuccess {String} toolType  zwraca flagę "DIA"  
 * @apiSuccess {Object} DIAsegments zwraca segmenty diaryzacji w postaci JSON. Aby pobrać wynik w innym formacie (CTM lub TextGrid) należy skorzystać z osobnego zapytania API.
 * 
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "message": 'Diaryzacja zakończona sukcesem!',
 *       "containerId": "5f58a92dfa006c8aed96f846",
 *       "toolType": "DIA",
 *       "VADSegments": [
 *                          {
 *                              "startTime":0.68,
 *                              "endTime":2.74,
 *                              "editable":true,
 *                              "color":"#394b55",
 *                              "labelText":"1"
 *                          },
 *                          {
 *                              "startTime":2.74,
 *                              "endTime":4.62,
 *                              "editable":true,
 *                              "color":"#394b55",
 *                              "labelText":"2"
 *                          },
  *                       ]
 *     }
 *
 * @apiError (503) ServiceUnavailable Gdy coś pójdzie nie tak z usługą
 * @apiError (500) ServerError 
 */


exports.runSpeechDiarization = (req, res, next) => {

  const containerId = req.params.containerId;
  //const toolType = req.body.toolType;

  Container.findById(containerId).then(container => {  
    runTask.runDIA(container)
      .then(DIAsegments => {
        console.log(chalk.green("Zakończono Diaryzacje dla: " + containerId));
        res.status(200).json({ message: 'Diaryzacja zakończona sukcesem!', containerId: containerId, toolType: "DIA",  DIAsegments: DIAsegments});
      }).catch(error => {
        console.log(chalk.red('TASK ERROR'));
        console.log(chalk.red(error.message))
        res.status(503).json({ message: 'Coś poszło nie tak z diaryzacją!', containerId: containerId, toolType: "DIA"});
      })
  }).catch(error => {
    console.log(chalk.red(error.message));
    error.statusCode = error.statusCode || 500;
    next(error);
  })
}


/**
 * @api {put} /repoFiles/runSpeechSegmentation/:containerId Segmentacja
 * @apiDescription Narzędzie segmentacji. Dla krótkich nagrań (poniżej 0.5MB) uruchamiany jest algorytm forcealign. Dla dłuższych plików segmentalign. Usługa wymaga uruchomienia najpierw usługi rozpoznawania. Po wykonaniu zapytania należy poczekać na zakończenie pracy. Po zakończeniu serwer zapisze rezultaty w kontenerze o danym ID. Aby ściągnąć rezultaty działania narzędzia należy skorzystać z osobnego zapytania API. W międzyczasie możesz odpytywać serwer na temat statusu wykonania tego narzędzia korzystając z osobnego zapytania API.
 * 
 * @apiName SEGTool
 * @apiGroup Narzędzia
 *
 * @apiParam {String} containerId Identyfikator zasobu. Możesz go również znaleźć w graficznym interfejsie użytkownika
 * @apiHeader {String} Authorization Ciąg znaków 'Bearer token' gdzie w miejsce 'token' należy wstawić token uzyskany podczas logowania.
 *
 * @apiSuccess {String} message informacja o zakończeniu działania
 * @apiSuccess {String} containerId  Identyfikator kontenera
 * @apiSuccess {String} toolType  zawiera flage "REC"
 * @apiSuccess {String} EMUlink  zawiera link do podglądu segmentacji w aplikacji EMU
 * 
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "message": 'Segmentacja została wykonana pomyślnie',
 *       "containerId": "5f58a92dfa006c8aed96f846",
 *       "toolType": "SEG",
 *       "EMUlink": "https://ips-lmu.github.io/EMU-webApp/?audioGetUrl=TODO"
 *     }
 *
 * @apiError (503) ServiceUnavailable Gdy coś pójdzie nie tak z usługą segmentacji
 * @apiError (500) ServerError 
 * 
 * 
 */
exports.runSpeechSegmentation = (req, res, next) => {

  const containerId = req.params.containerId;
  //const toolType = req.body.toolType;

  Container.findById(containerId).then(container => {  
    runTask.runSEG(container)
      .then(returnData => {
        let updatedContainer = returnData.updatedContainer;
        let EMUlink = returnData.EMUlink;


        console.log(chalk.green("Zakończono Segmentacje dla: " + containerId));
        res.status(200).json({ message: 'Segmentacja została wykonana pomyślnie', containerId: updatedContainer._id, toolType: "SEG", EMUlink: EMUlink});
      }).catch(error => {
        console.log(chalk.red('TASK ERROR'));
        console.log(chalk.red(error.message))
        res.status(503).json({ message: 'Coś poszło nie tak z segmentacją!', containerId: containerId, toolType: "SEG"});
      })
  }).catch(error => {
    console.log(chalk.red(error.message));
    error.statusCode = error.statusCode || 500;
    next(error);
  })
}



/**
 * @api {put} /repoFiles/runSpeechRecognition/:containerId Rozpoznawanie mowy
 * @apiDescription Narzędzie rozpoznaje automatycznie mowę z wgranego pliku. Po wykonaniu zapytania należy poczekać na zakończenie pracy. Po zakończeniu serwer zapisze rezultaty w kontenerze o danym ID. Aby ściągnąć rezultaty działania narzędzia należy skorzystać z osobnego zapytania API. W międzyczasie możesz odpytywać serwer na temat statusu wykonania tego narzędzia korzystając z osobnego zapytania API.
 * @apiName RECTool
 * @apiGroup Narzędzia
 *
 * @apiParam {String} containerId Identyfikator zasobu. Możesz go również znaleźć w graficznym interfejsie użytkownika
 * @apiHeader {String} Authorization Ciąg znaków 'Bearer token' gdzie w miejsce 'token' należy wstawić token uzyskany podczas logowania.
 *
 * @apiSuccess {String} message that this tool finished working
 * @apiSuccess {String} containerId  Identyfikator kontenera
 * @apiSuccess {String} toolType  zawiera flage "REC"
 * 
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "message": 'Rozpoznawanie mowy zostało zakończone!',
 *       "containerId": "5f58a92dfa006c8aed96f846",
 *       "toolType": "REC",
 *     }
 *
 * @apiError (503) Service Unavailable Gdy coś pójdzie nie tak z usługą rozpoznawania
 * @apiError (500) Serwer error 
 * 
 */

exports.runSpeechRecognition = (req, res, next) => {
  //const containerId = req.body.containerId;
  //const toolType = req.body.toolType;
  const containerId = req.params.containerId;
  console.log(containerId)
  console.log(chalk.cyan("uruchamiam SpeechRecognition"));

  // tutaj odpalam odpowiednia usługę
  Container.findById(containerId).then(container => {  
    runTask.runREC(container)
      .then(updatedContainer => {
          console.log(chalk.green("Zakończono speech recognition dla: " + containerId ));
          res.status(200).json({ message: 'Rozpoznawanie mowy zostało zakończone!', containerId: updatedContainer._id, toolType: "REC"});
      }).catch(error => {
          console.log(chalk.red('TASK ERROR'));
          console.log(chalk.red(error.message))
          res.status(503).json({ message: 'Coś poszło nie tak z rozpoznawaniem mowy!', containerId: containerId, toolType: "REC"});
      })
  }).catch(error => {
    console.log(chalk.red(error.message));
    error.statusCode = error.statusCode || 500;
    next(error);
  })
}






 
/**
 * @api {GET} /repoFiles/download/:containerId/:fileType Pobierz wyniki
 * @apiDescription Za pomocą tego zapytania możesz pobrać efekty pracy narzędzi automatycznych. Oprócz tego możesz pobrać oryginalnie wgrany plik oraz plik przekonwertowany do formatu PCM 16000Hz 16bits.
 * @apiName GETOutputFile
 * @apiGroup Pliki
 *
 * @apiParam {String} containerId   Identyfikator kontenera dla którego chcesz pobrać wynik. Możesz go również znaleźć w interfejsie użytkownika
 * @apiParam {String} fileType  Wskazanie formatu w jakim chcesz pobrać wynik. <h3>Pliki audio</h3><ul><li>"oryginalAudio": Pobranie pliku który został wysłany na serwer.</li><li>"audio" : pobranie pliku przekonwertowanego do PCM 16000Hz 8bits</li></ul><h3>Detekcja mowy (VAD) </h3><ul><li>"VADctm": Wynik działania VAD w formacie CTM</li><li>"VADtextGrid": Wynik działania VAD w formacie TextGrid</li><li>"VADJSON": Wynik działania VAD w formacie JSON</li></ul><h3>Diaryzacja (DIA)</h3><ul><li>"DIActm": Wynik działania DIA w formacie CTM</li><li>"DIAtextGrid": Wynik działania DIA w formacie TextGrid.</li><li>"DIAJSON": Wynik działania DIA w formacie JSON.</li></ul><h3>Rozpoznawanie mowy (REC)</h3><ul><li>"JSONTranscript": Wynik działania REC w formacie JSCON</li><li>"TXTTranscript": Wynik działania REC w formacie TXT.</li></ul><h3>Segmentacja (SEG)</h3><ul><li>"SEGctm": Wynik działania SEG w formacie CTM</li><li>"SEGtextGrid": Wynik działania SEG w formacie TextGrid.</li><li>"EMUJSON": Wynik działania SEG w formacie EMU-SDMS. Plik tego typu jest tworzony tylko podczas tworzenia korpusu z projektu.</li></ul> 
 * @apiHeader {String} Authorization Ciąg znaków 'Bearer token' gdzie w miejsce 'token' należy wstawić token uzyskany podczas logowania.
 *
 * @apiSuccess {Object} File zwraca żądany plik
 * 
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK input 1 0.120 7.610 speech
 *
 * @apiError (404) NotFound Nie znaleziono kontenera o danym ID
 * @apiError (500) ServerError Coś poszło nie tak na serwerze
 * 
 */
// ###################################################
// ########### pobieram plik z repozytorium użytkownika
// ######################################################
exports.getFileFromContainer = (req,res,next) => {

 // const userId = req.params.userId;
 // const projectId = req.params.projectId;
 // const sessionId = req.params.sessionId;

  const containerId = req.params.containerId;
  
  const fileType = req.params.fileType;

  //pobieram kontener z bazy danych
  Container.findById(containerId)
    .then(container => {

        if(!container){
          const error = new Error('Nie znaleziono kontenera o danym ID');
          error.statusCode = 404;
          throw error;
        }

        const userId = container.owner;
        const projectId = container.project;
        const sessionId = container.session;

        //sciezka do pliku dat
        const repoPath = appRoot + "/repo/" + userId + "/" + projectId + "/" + sessionId;

        const containerFolderName = utils.getFileNameWithNoExt(container.fileName);
        const fileAudioName = container.fileName;
        const fileDatName = utils.getFileNameWithNoExt(container.fileName)+".dat";

        let filename = '';

        //sprawdzam o jaki typ pliku mi chodzi
        let filePath = '';

        switch(fileType){
          case "audio": //audio w 16000Hz 16bit...
            filePath = repoPath + "/" + containerFolderName + "/" + fileAudioName;
            filename = fileAudioName;
            break;
          case "dat": //audiowaveform dat
            filePath = repoPath + "/" + containerFolderName + "/" + fileDatName;
            filename = fileDatName;
            break;
          case "oryginalAudio": //audio as it was uploaded
            const oryginalAudioName = container.oryginalFileName;
            filePath = repoPath + "/" + containerFolderName + "/" + oryginalAudioName;
            filename = oryginalAudioName;
            break;
          case "DIActm": 
            const DIActmFile = utils.getFileNameWithNoExt(container.fileName)+"_DIA.ctm";
            filePath = repoPath + "/" + containerFolderName + "/" + DIActmFile;
            filename = DIActmFile;
            break;
          case "DIAtextGrid": 
            const DIAtextGrid = utils.getFileNameWithNoExt(container.fileName)+"_DIA.textGrid";
            filePath = repoPath + "/" + containerFolderName + "/" + DIAtextGrid;
            filename = DIAtextGrid;
            break;
          case "DIAJSON": 
            const DIAJSON = utils.getFileNameWithNoExt(container.fileName)+"_DIA.json";
            filePath = repoPath + "/" + containerFolderName + "/" + DIAJSON;
            filename = DIAJSON;
            break;
          case "VADctm": 
            const VADctmFile = utils.getFileNameWithNoExt(container.fileName)+"_VAD.ctm";
            filePath = repoPath + "/" + containerFolderName + "/" + VADctmFile;
            filename = VADctmFile;
            break;
          case "VADtextGrid": 
            const VADtextGrid = utils.getFileNameWithNoExt(container.fileName)+"_VAD.textGrid";
            filePath = repoPath + "/" + containerFolderName + "/" + VADtextGrid;
            filename = VADtextGrid;
            break;
          case "SEGctm": 
            const SEGctmFile = utils.getFileNameWithNoExt(container.fileName)+"_SEG.ctm";
            filePath = repoPath + "/" + containerFolderName + "/" + SEGctmFile;
            filename = SEGctmFile;
            break;
          case "SEGtextGrid": 
            const SEGtextGrid = utils.getFileNameWithNoExt(container.fileName)+"_SEG.textGrid";
            filePath = repoPath + "/" + containerFolderName + "/" + SEGtextGrid;
            filename = SEGtextGrid;
            break;
          case "VADJSON": 
            const VADJSON = utils.getFileNameWithNoExt(container.fileName)+"_VAD.json";
            filePath = repoPath + "/" + containerFolderName + "/" + VADJSON;
            filename = VADJSON;
            break;
          case "JSONTranscript": 
            const JSONTranscript = utils.getFileNameWithNoExt(container.fileName)+".json";
            filePath = repoPath + "/" + containerFolderName + "/" + JSONTranscript;
            filename = JSONTranscript;
            break;
          case "TXTTranscript": 
            const TXTTranscript = utils.getFileNameWithNoExt(container.fileName)+"_TXT.txt";
            filePath = repoPath + "/" + containerFolderName + "/" + TXTTranscript;
            filename = TXTTranscript;
            break;
          case "EMUJSON": 
            const EMUJSON = utils.getFileNameWithNoExt(container.fileName)+"_annot.json";
            filePath = repoPath + "/" + containerFolderName + "/" + EMUJSON;
            filename = EMUJSON;
            break;
          default:
            const error = new Error("Nie rozpoznano typu wyjścia");
            throw error;
            //filePath = '';
            //filename = 'default';
            //console.log("wrong file type!!")
        }

        //res.status(200).({ message: 'The data for previewing has been sent!', containerData: filePath});        
       // res.sendFile(filePath);
        //res.set('Content-Type', 'application/json');
       // res.status(200).json({toolType: toolType});
       // res.append("toolType", toolType);
       // fs.createReadStream(filePath).pipe(res);

       try {
          if(fs.existsSync(filePath)) {
              res.download(filePath,filename);
          } else {
              const err = new Error("Plik tego typu nie został stworzony!")
              throw err;
          }
        } catch (err) {
            throw err;
        }


    }).catch(error=>{
      console.log(chalk.red(error.message));
      error.statusCode = error.statusCode || 500;
      next(error);
    })
}



/**
 * @api {delete} /repoFiles/deleteSession/:sessionId  Usuwanie sesji
 * @apiDescription Usuwa sesje wraz z jej zawartością
 * @apiName DELETESession
 * @apiGroup Pliki
 *
 * @apiParam {String} sessionId ID usuwanej sesji
 * @apiHeader {String} Authorization Ciąg znaków 'Bearer token' gdzie w miejsce 'token' należy wstawić token uzyskany podczas logowania.
 *
 * @apiSuccess {String} message 'Sesja wraz z awartością została usunięta!'
 * @apiSuccess {String} sessionId  Id usuniętej sesji
 * 
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "message": 'Sesja wraz z awartością została usunięta!',
 *       "sessionId": "5f58a92dfa006c8aed96f846",
 *     }
 * 
 * @apiError (500) ServerError 
 * 
 */

//##########################################
//#### usuwanie sesji
//#######################################

exports.removeSession = (req,res,next) => {

  let userId;
  let projectId;
  const sessionId = req.params.sessionId;
  let sessionPath;
  let containersInThisSession = [];

  //usuwam sesje
  Session.findByIdAndRemove(sessionId)
    .then(foundSession => {
        if(!foundSession){
          const notSessionFoundError = new Error("Błędne ID sesji!");
          console.log(chalk.red(notSessionFoundError.message));
          throw notSessionFoundError;
        }

        containersInThisSession = foundSession.containersIds;
        projectId = foundSession.projectId;

        //usuwam odniesienie do sesji w projekcie
        return ProjectEntry.findByIdAndUpdate(projectId, {$pull: {sessionIds: sessionId}});
      })
      .then(foundProject=>{
        userId = foundProject.owner;
        
        //usuwam kontenery które przynależały do tej sesji
        sessionPath = appRoot + "/repo/" + userId + "/" + projectId + "/" + sessionId;

        return Container.deleteMany({_id: containersInThisSession});

      })
      .then(foundContainers =>{
          //usuwam folder sesji z dysku fizycznie
          try {
            fs.removeSync(sessionPath);
            res.status(200).json({ message: 'Sesja została usunięta', sessionId: sessionId});
          } catch (error) {
            throw error;
          }
      })
      .catch(error => {
        console.log(chalk.red(error.message));
        next(error);
      })
}



/**
 * @api {delete} /repoFiles/delete/:containerId Usuwanie kontenera
 * @apiDescription Usuwa kontener oraz wszystko co z nim związane (pliki, anotacje, wpisy w bazie danych). 
 * @apiName DELETEcontainer
 * @apiGroup Pliki
 *
 * @apiParam {String} containerId Identyfikator kontenera który chcesz usunąć
 * @apiHeader {String} Authorization Ciąg znaków 'Bearer token' gdzie w miejsce 'token' należy wstawić token uzyskany podczas logowania.
 *
 * @apiSuccess {String} message Kontener został usunięty!
 * @apiSuccess {String} containerId  ID kontenera który został usunięty
 * @apiSuccess {String} sessionId  ID sesji do której należy kontener
 * 
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "message": 'Kontener został usunięty!',
 *       "sessionId": "5f58a92dfa006c8aed96f846",
 *       "containerId": "5f58a92dfa006c8aed96f846",
 *     }
 * 
 * @apiError (404) NotFound Nie znaleziono kontenera o danym ID
 * @apiError (500) ServerError 
 * 
 */

//##########################################
//#### usuwanie pojedynczego kontenera z repo ######
//##########################################
exports.removeContainer = (req,res,next) => {

  const containerId = req.params.containerId;

  //console.log("USUWAM CONTAONER: " + containerId)
  Container.findById({_id:containerId})
    .then(foundContainer => {

      if(!foundContainer){
        const error = new Error('Nie znaleziono kontenera o danym ID');
        error.statusCode = 404;
        throw error;
      }

        const userId = foundContainer.owner;
        const projectId = foundContainer.project;
        const sessionId = foundContainer.session;

        const conainerFolder = utils.getFileNameWithNoExt(foundContainer.fileName);

        const containerPath = appRoot + "/repo/" + userId + "/" + projectId + "/" + sessionId + "/" + conainerFolder;

        //usuwam folder kontenera z dysku fizycznie
        fs.remove(containerPath).then(()=>{
          //usuwam wpis w kolekcji Containers
          Container.findByIdAndRemove(containerId)
          .then(removedContainer => {
              //usuwam odniesienie w kolekcji Sessions
              Session.findByIdAndUpdate(sessionId,{$pull: {containersIds: containerId}})
              .then(updatedSession =>{
                res.status(200).json({ message: 'Kontener został usunięty!', sessionId: sessionId, containerId: containerId});
              })
              .catch(error => {
                throw error;
              })
          })
          .catch(error => {
            throw error;
          })
        }).catch(error=>{
          throw error;
        });
    }).catch(error=>{
      console.log(chalk.red(error.message));
      error.statusCode = error.statusCode || 500;
      next(error);
    })
}




/**
 * @api {post} /repoFiles/uploadFile Wgrywanie pliku
 * @apiDescription Wgranie pliku audio lub transkrypcji na serwer. W przypadku pliku audio należy podać id projektu oraz sesji do której wgrany będzie plik. W przypadku pliku transkrypcji (txt) należy podać dodatkowo id kontenera którego dotyczy.
 * @apiName UPLOADfile
 * @apiGroup Pliki
 *
 * @apiParam {String} projectId Identyfikator projektu
 * @apiParam {String} sessionId Identyfikator sesji
 * @apiParam {String} containerId Identyfikator kontenera
 * @apiParam {String} myFile Plik audio lub txt
 * @apiHeader {String} Authorization Ciąg znaków 'Bearer token' gdzie w miejsce 'token' należy wstawić token uzyskany podczas logowania.
 *
 * @apiSuccess {String} message Informacja o powodzeniu
 * @apiSuccess {String} containerId  ID kontenera który został został stworzony bądź do którego wgrano transkrypcje
 * @apiSuccess {String} sessionId  ID sesji do której należy kontener
 * @apiSuccess {String} oryginalName  nazwa wgranego pliku
 * 
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "message": 'Wgranie pliku zakończone powodzeniem!',
 *       "sessionId": "5f58a92dfa006c8aed96f846",
 *       "oryginalName": "sampleAudio.mp3"
 *       "containerId": "5f58a92dfa006c8aed96f847",
 *     }
 * 
 * @apiError (500) ServerError 
 * 
 */


//##########################################
//#### upload pojedynczego pliku do repo ###
//#######################################

exports.uploadFile = async (req, res, next) => {

  const savedFile = req.file.filename; // już z unikatowym id
  const oryginalFileName = req.file.originalname; //nazwa oryginalnego pliku

  let type = req.file.mimetype;
  let typeArray = type.split("/");

  //const userId = req.body.userId;
  const projectId = req.body.projectId;
  const sessionId = req.body.sessionId;

  //tylko w przypadku innych plików niż audio
  const containerId = req.body.containerId; 
  let userId;
  let fullFilePath;
  let conainerFolderName;
  let containerFolderPath;

  try {

    const {owner} = await ProjectEntry.findById(projectId);
    userId = owner;
  
    let fileWithNoExt = utils.getFileNameWithNoExt(savedFile);
    let fileWithNoSufix = fileWithNoExt.substring(0, fileWithNoExt.length - 5);
  
    conainerFolderName = fileWithNoSufix;
    containerFolderPath = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + conainerFolderName;
    fullFilePath = containerFolderPath + "/" + savedFile;

  } catch (error) {
    error.message = "Coś poszło nie tak z przekazanymi parametrami. Sprawdź czy są poprawne!";
    console.log(chalk.red(error.message))
    throw error;
  }

  //jeżeli wgrywany plik to audio
  if(typeArray[0] == 'audio'){

      // ROBIE KONWERSJE FFMPEG
      try {

        let process = new ffmpeg(fullFilePath);
        process.then(audio => {
          audio.setAudioFrequency(16000)
                .setAudioChannels(1)
                .setAudioBitRate(256);

          audio.addCommand('-y', '');
          audio.addCommand('-sample_fmt', 's16');

          //teraz robie konwersje na WAV i usuwam sufix _temp w docelowym pliku
          // musze tak robic bo zapisywanie w miejscu nie dziala przy dlugich plikach....

          const finalAudioFileName = conainerFolderName + ".wav";
          const fillCorrectAudioPath = containerFolderPath + "/" + finalAudioFileName;

          //tworze odpowiednia nazwe kontenera - bez unikatowego ID oraz bez rozszerzenia
          //const finalContainerName = oryginalFileName;

          audio.save(fillCorrectAudioPath)
                .then(convertedFile=>{

                  //teraz zmieniam nazwe pliku na taki jaki był przesłany oryginalnie - usuwając unikatowe id i _temp.
                  //Czyli przywracam plikowi oryginalna nazwe

                  let tooryginal = utils.bringOryginalFileName(fullFilePath);
                  fs.renameSync(fullFilePath, tooryginal);

                  //zapisuje tą informaje do DB
                  let newContainer = new Container({
                    fileName: finalAudioFileName,
                    containerName: utils.getFileNameWithNoExt(oryginalFileName),
                    oryginalFileName: utils.getFileNameFromPath(tooryginal),
                    size: fs.statSync(fillCorrectAudioPath).size,
                    owner: userId,
                    project: projectId,
                    session: sessionId,
                    ifVAD: false,
                    ifDIA: false,
                    ifREC: false,
                    ifSEG: false,
                    statusVAD: 'ready',
                    statusDIA: 'ready',
                    statusREC: 'ready',
                    statusSEG: 'ready',
                  });

                  let ext = utils.getFileExtention(finalAudioFileName);
                  ext = (ext[0]+'').toLowerCase();

                  const finalDATFileName = conainerFolderName + ".dat";
                  const fillCorrectDATPath = containerFolderPath + "/" + finalDATFileName;

                  const shellcomm = 'audiowaveform -i '+fillCorrectAudioPath+' -o '+fillCorrectDATPath+' -z 32 -b 8 --input-format ' + ext;

                  //obliczam z pliku audio podgląd dat
                  if (shell.exec(shellcomm).code !== 0) {
                    shell.echo('Error: Problem with extracting dat for audio file');
                    console.log(chalk.red('Error: Problem with extracting dat for audio file'));
                    //shell.exit(1);
                    const err = new Error('Error: Problem with extracting dat for audio file');
                    throw err;
                  } else {
                    newContainer.save()
                    .then(createdContainer => {
                      //updating the reference in given session
                      Session.findOneAndUpdate({_id: sessionId},{$push: {containersIds: createdContainer._id }})
                        .then(updatedSession => {
                          res.status(200).json({ message: 'Wgranie pliku zakończone powodzeniem!', sessionId: sessionId, oryginalName: oryginalFileName, containerId: createdContainer._id})
                        })
                    })
                    .catch(error => {
                      throw error;
                    })
                  }
                }).catch(err =>{
                  throw err;
                })
        }).catch(error=>{
          throw error;
        })


      } catch (error) {
        console.log(chalk.red(error.message));
        error.statusCode = error.statusCode || 500;
        next(error);
      }
  } else if(typeArray[0] == 'text'){
    try {

      //wyszukuje czy taki kontener istnieje

      const updatedContainer = await Container.findByIdAndUpdate(containerId,{ifREC: true, statusREC:'done'});

      const oryginalFolderName = utils.getFileNameWithNoExt(updatedContainer.fileName);
      const sciezkaOryginalna = appRoot + '/repo/'+userId+'/'+projectId+'/'+sessionId+'/' + oryginalFolderName + '/' + savedFile ;

      let fileWithNoExt = utils.getFileNameWithNoExt(savedFile);
      let fileWithNoSufix = fileWithNoExt.substring(0, fileWithNoExt.length - 5);

      //console.log(updatedContainer)
      const docelowaSciezka = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' +oryginalFolderName + '/' + utils.getFileNameWithNoExt(updatedContainer.fileName)+ '_TXT.txt';
      fs.moveSync(sciezkaOryginalna,docelowaSciezka,{ overwrite: true });

      //zapisuje transkrypcje do pliku JSON
      const JSONtranscription = utils.convertTxtFileIntoJSON(docelowaSciezka);

      //zapisuje tego JSONA w katalogu containera
      const JSONTransPath = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + oryginalFolderName + '/' + utils.getFileNameWithNoExt(updatedContainer.fileName) + '.json';

      await fs.writeJson(JSONTransPath, JSONtranscription);

      //TO DO przerobienie tego na plik JSON - aby dało się podglądać

      res.status(200).json({ message: 'Wgranie pliku zakończone powodzeniem!', sessionId: sessionId, oryginalName: oryginalFileName, containerId: updatedContainer._id});


    } catch (error) {
      throw error;
    }
  } else {
    const error = new Error("Zły typ pliku");
    error.statusCode = 406;
    next(error);
  }

}



//##########################################
//#### tworzenie nowej sesji ######
//#######################################

exports.createNewSessionHandler = (sesName, projId) => {
  return new Promise((resolve, reject) => {

      const sessionName = sesName;
      const projectId = projId;

      let userId = null;
      let sessionId = null;
      
      ProjectEntry.findById(projectId).then(foundProject=>{
        if(!foundProject){
          const projIDError = new Error("Nie znaleziono projektu o zadanym ID");
          throw projIDError;
        }
        return foundProject.owner;
      }).then(owner => {
        userId = owner;

        //walidacja nazwy sesji
        const sessNameError = new Error("Błędna nazwa sesji lub jej brak!");
        if(!sessionName){
          throw sessNameError;
        } else{
          if(sessionName.trim().length < 1 || sessionName.trim().length > 100){
            throw sessNameError;
          }
        }
        

        let session = new Session({
          name: sessionName,
          projectId: projectId,
        });

        return session.save();
      }).then(createdSession=>{
        sessionId = createdSession._id;
        return ProjectEntry.findByIdAndUpdate(projectId,{$push: {sessionIds: createdSession._id}});
      }).then(updatedProject =>{
        
        const repoPath = appRoot + "/repo/" + userId + "/" + projectId;
        fs.mkdir(repoPath + '/' + sessionId).then(()=>{
          return sessionId;
        }).catch(error=>{
          throw error;
        }) 
      }).then((sessionId)=>{
        resolve(sessionId);
      }).catch(error=>{
        error.statusCode = error.statusCode || 500;
        reject(error)
      });
  });
}


/**
 * @api {put} /repoFiles/createNewSession  Tworzenie sesji
 * @apiDescription Tworzy nową sesje (folder) w istniejącym projekcie
 * @apiName CREATESession
 * @apiGroup Pliki
 *
 * @apiParam {String} sessionName Nazwa nowo tworzonej sesji
 * @apiParam {String} projectId Identyfikator projektu w którym ma być stworzona sesja
 * @apiHeader {String} Authorization Ciąg znaków 'Bearer token' gdzie w miejsce 'token' należy wstawić token uzyskany podczas logowania.
 *
 * @apiSuccess {String} message 'Nowa sesja została utworzona!'
 * @apiSuccess {String} sessionName  Nazwa nowo stworzonej sesji
 * @apiSuccess {String} id  ID nowo stworzonej sesji
 * 
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "message": 'Nowa sesja została utworzona!',
 *       "sessionName": "Nowa sesja",
 *       "id": "5f58a92dfa006c8aed96f846",
 *     }
 * 
 * @apiError (500) ServerError 
 * 
 */

exports.createNewSession = (req, res, next) => {
    const sessionName = req.body.sessionName;
    const projectId = req.body.projectId;

    this.createNewSessionHandler(sessionName, projectId).then(newSessionId=>{
      res.status(200).json({ message: 'Nowa sesja została utworzona!', sessionName: sessionName, id: newSessionId});
    }).catch(error=>{
      error.statusCode = error.statusCode || 500;
      next(error);
    });
}


/**
 * @api {get} /repoFiles/:projectId Zawartość projektu
 * @apiDescription Zapytanie zwraca zawartość danego projektu w postaci listy sesji oraz kontenerów
 * @apiName GETrepoassets
 * @apiGroup Pliki
 *
 * @apiParam {String} projectId Identyfikator projektu 
 * @apiHeader {String} Authorization Ciąg znaków 'Bearer token' gdzie w miejsce 'token' należy wstawić token uzyskany podczas logowania.
 *
 * @apiSuccess {String} message Pliki dla tego projektu zostały pobrane!
 * @apiSuccess {String} sessions  Lista sesji
 * @apiSuccess {String} containers  Lista kontenerów
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "message": 'Nowa sesja została utworzona!',
 *       "sessions": [
 *        {
 *            "id": "5fdce8d1673bf111427d73ba",
 *            "sessionName": "demo",
 *            "ifSelected": false,
 *            "containers": [
 *                "5fdce8d1673bf111427d73bb",
 *                "5fdce8d1673bf111427d73bc",
 *                "5fdce8d1673bf111427d73bd",
 *                "5fdce8d1673bf111427d73be",
 *                "5fdce8d1673bf111427d73bf"
 *            ]
 *        },
 *        {
 *            "id": "5fdd0af7673bf111427d73c0",
 *            "sessionName": "\"nowaSesjaAPI\"",
 *            "ifSelected": false,
 *            "containers": []
 *        }],
 *       "containers": [
 *        {
 *            "ifVAD": true,
 *            "ifDIA": true,
 *            "ifREC": true,
 *            "ifSEG": true,
 *            "errorMessage": "",
 *            "_id": "5fdce8d1673bf111427d73bb",
 *            "fileName": "celnik-1189e21a.wav",
 *            "containerName": "celnik",
 *            "oryginalFileName": "celnik.wav",
 *            "size": "214078",
 *            "owner": "5fc4d01a9045bb531c0b01a4",
 *            "project": "5fdce8d1673bf111427d73b8",
 *            "session": "5fdce8d1673bf111427d73ba",
 *            "statusVAD": "done",
 *            "statusDIA": "done",
 *            "statusREC": "done",
 *            "statusSEG": "done",
 *            "VADUserSegments": [
 *                {
 *                    "startTime": 0.68,
 *                    "endTime": 2.74,
 *                    "editable": true,
 *                    "color": "#394b55",
 *                    "labelText": "speech"
 *                },
 *                {
 *                    "startTime": 2.74,
 *                    "endTime": 5.97,
 *                    "editable": true,
 *                    "color": "#394b55",
 *                    "labelText": "speech"
 *                }
 *            ],
 *            "DIAUserSegments": [
 *                {
 *                    "startTime": 0.68,
 *                    "endTime": 2.74,
 *                    "editable": true,
 *                    "color": "#394b55",
 *                    "labelText": "1"
 *                },
 *                {
 *                    "startTime": 2.74,
 *                    "endTime": 4.62,
 *                    "editable": true,
 *                    "color": "#394b55",
 *                    "labelText": "2"
 *                },
 *                {
 *                    "startTime": 4.62,
 *                    "endTime": 5.97,
 *                    "editable": true,
 *                    "color": "#394b55",
 *                    "labelText": "3"
 *                }
 *            ],
 *            "RECUserSegments": [],
 *            "SEGUserSegments": [],
 *            "__v": 0,
 *            "createdAt": "2020-12-18T17:37:21.828Z",
 *            "updatedAt": "2020-12-18T17:37:21.828Z"
 *        },
 *        {
 *            "ifVAD": true,
 *            "ifDIA": true,
 *            "ifREC": false,
 *            "ifSEG": false,
 *            "errorMessage": "",
 *            "_id": "5fdce8d1673bf111427d73bc",
 *            "fileName": "kleska-29d61ce0.wav",
 *            "containerName": "kleska",
 *            "oryginalFileName": "kleska.wav",
 *            "size": "274078",
 *            "owner": "5fc4d01a9045bb531c0b01a4",
 *            "project": "5fdce8d1673bf111427d73b8",
 *            "session": "5fdce8d1673bf111427d73ba",
 *            "statusVAD": "done",
 *            "statusDIA": "done",
 *            "statusREC": "ready",
 *            "statusSEG": "ready",
 *            "VADUserSegments": [
 *                {
 *                    "startTime": 1.31,
 *                    "endTime": 7.81,
 *                    "editable": true,
 *                    "color": "#394b55",
 *                    "labelText": "speech"
 *                }
 *            ],
 *            "DIAUserSegments": [
 *                {
 *                    "startTime": 1.31,
 *                    "endTime": 4.69,
 *                    "editable": true,
 *                    "color": "#394b55",
 *                    "labelText": "3"
 *                },
 *                {
 *                    "startTime": 4.68,
 *                    "endTime": 6.18,
 *                    "editable": true,
 *                    "color": "#394b55",
 *                    "labelText": "1"
 *                },
 *                {
 *                    "startTime": 6.18,
 *                    "endTime": 7.81,
 *                    "editable": true,
 *                    "color": "#394b55",
 *                    "labelText": "2"
 *                }
 *            ],
 *            "RECUserSegments": [],
 *            "SEGUserSegments": [],
 *            "__v": 0,
 *            "createdAt": "2020-12-18T17:37:21.828Z",
 *            "updatedAt": "2020-12-18T17:37:21.828Z"
 *        }]
 *     }
 * 
 * @apiError (500) ServerError 
 * 
 */
//#######################################################
//################ pobieram assety użytkownika ##########
//#########################################################

exports.getRepoAssets = (req,res,next) => {

 
  //wydobywam dane z urla
 // const userId = req.params.userId;
  const projectId = req.params.projectId;

 // console.log("test");
 // console.log(projectId);
  
  //szukam plików w bazie danych dla danego usera
  let znalezionyProjekt = null;
  let userId = null;
  ProjectEntry.findById(projectId)
    .then(foundPE => {

      if(!foundPE){
        const noProjectErr = new Error("Nie znaleziono tego projektu");
        throw noProjectErr;
      }

      znalezionyProjekt = foundPE;
      userId = znalezionyProjekt.owner;
      
      return User.findById(userId);
    })
    .then(user => {

      
      if((user._id + "")== (userId+"")) {
        //wydobywam liste sesji
        let sessionIds = znalezionyProjekt.sessionIds;

        let sessionList = [];
        let containerList = [];

        Session.find({_id: sessionIds})
          .then(listaSesji => {
            sessionList = listaSesji;

            sessionList = listaSesji.map(sesja => {
              return({
                id: sesja._id,
                sessionName: sesja.name,
                ifSelected: false,
                containers: sesja.containersIds,
              });
            })
            return sessionList;
          })
          .then(listaSesji => {

            Container.find({owner: userId, project: projectId})
              .then(containers=>{

                containerList = containers;

                res.status(200).json({ message: 'Pliki dla tego projektu zostały pobrane!', sessions: sessionList, containers: containerList })
              })
          })
          .catch(error => {
            console.log(error);
            throw error;
          })

      } else {
        let error = new Error('Not authorized access');
        error.statusCode = 401;
        throw error;
      }
    })
    .catch(err => {
      console.log(chalk.red(err.message))
      next(err)
    })
}

