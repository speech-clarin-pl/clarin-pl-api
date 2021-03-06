const fs = require('fs-extra');
const ffmpeg = require('ffmpeg');
const appRoot = require('app-root-path'); //zwraca roota aplikacji
const utils = require('../utils/utils');
const ProjectEntry = require('../models/projectEntry');
const Container = require('../models/Container')
const Session = require('../models/Session');
const User = require('../models/user');
const shell = require('shelljs');
const chalk = require('chalk');
const createNewSessionHandler = require('./Handlers/createNewSessionHandler');
const createCorpusHandler = require('./Handlers/createCorpusHandler')
const runTask = require('./runTask');
const moment = require('moment');
var ObjectId = require('mongoose').Types.ObjectId;


/**
 * @api {get} /repoFiles/createCorpus/:projectId Tworzenie korpusu
 * @apiDescription Wywołanie powoduje inicjalizację procesu tworzenia korpusu w formacie EMU-SDMS i zapisuje go na serwerze w postaci pliku ZIP. Korpus jest tworzony z plików dla których wykonane zostały wszystkie poziomy anotacji (VAD, DIA, REC oraz SEG). Proces może trać dłuższy czas w zależności od ilości plików w projekcie. Po zakończeniu możesz ściągnąć korpus za pomocą osobnego zapytania API. 
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

//refactoredOK
exports.exportToEmu = async (req, res, next) => {

  try {

    const projectId = req.params.projectId;
  
    //const userId = req.params.userId;
    const userId = req.userId;

    const foundProject = await ProjectEntry.findById(projectId);

    if(!foundProject){
      const wrongProjIDErr = new Error("Nie znaleziono projektu o danym ID");
      wrongProjIDErr.statusCode = 404;
      throw wrongProjIDErr
    }

    await foundProject.checkPermission(req.userId);


    console.log(chalk.green("Rozpoczynam tworzenie korpusu..."));

    //const pathToZIP = "temp"
    const pathToZIP = await createCorpusHandler(foundProject);

    //aktualizuje informacje w bazie danych na temat stworzonego korpusu
    foundProject.corpusCreatedAt = Date.now();
    await foundProject.save();

    console.log(chalk.green("ZIP korpusu stworzony: " + pathToZIP));

    const corpusCreatedDate = moment(foundProject.corpusCreatedAt).format("YYYY-MM-DD, h:mm:ss a")

    res.status(200).json({ message: 'Tworzenie korpusu zakończone sukcesem. Możesz go ściągnąć.', corpusCreatedAt: corpusCreatedDate});


  } catch (error) {
    error.message = error.message || "Błąd tworzenia korpusu ZIP";
    error.statusCode = error.statusCode || 500;
    next(error);
  }  
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

exports.getReadyKorpus = async (req,res,next) => {

  try {

    const userId = req.userId;
    const projectId = req.params.projectId;
  
    const foundPE = await ProjectEntry.findById(projectId);

    if(!foundPE){
      const error = new Error('Nie znaleziono projektu o danym ID');
      error.statusCode = 404;
      throw error;
    }


    //sprawdzam czy mam uprawnienia
    await foundPE.checkPermission(req.userId);


    const nazwaKorpusu = 'KORPUS';
    const pathToUserProject = appRoot + '/repo/' + userId + '/' + projectId;
    const pathToCorpus = pathToUserProject + '/' + nazwaKorpusu;
    const pathToZIP = pathToCorpus+'.zip';


    if(fs.existsSync(pathToZIP)) {
      res.download(pathToZIP,(nazwaKorpusu+'.zip'));
    } else {
      const corpusNotCreatedErr = new Error("Dla tego projektu nie został wygenerowany korpus");
      throw corpusNotCreatedErr;
    }

  } catch (error) {
    error.message = error.message || "Błąd pobierania gotowego korpusu";
    error.statusCode = error.statusCode || 500;
    next(error);
  }
  
 }



 /**
 * @api {put} /repoFiles/moveContainerToSession/:containerId Przenoszenie kontenera
 * @apiDescription Przenoszenie kontenera do innej sesji
 * @apiName MoveContainer
 * @apiGroup Pliki
 *
 * @apiParam {String} containerId id kontenera ktory chcemy przenieść
 * @apiParam {String} sessionId id sesji do której chcemy przenieść kontener
 * @apiHeader {String} Authorization Ciąg znaków 'Bearer token' gdzie w miejsce 'token' należy wstawić token uzyskany podczas logowania.
 *
 * @apiSuccess {String} message że kontener został przeniesiony
 * @apiSuccess {String} containerId id kontenera przenoszonego
 * @apiSuccess {String} sessionId id sesji do ktorej zostal przeniesiony kontener
 * 
 * @apiError (404) NotFound nie znaleziono kontenera o danym ID 
 * @apiError (500) ServerError 
 */

//#############################################
//##### przenosze kontener do innej sesji #####
//#############################################
//refactoredOK
exports.moveContainerToSession = async (req,res, next) => {
  try {

    const containerId = req.params.containerId;
    const sessionIdTo = req.body.sessionId;

    const container = await Container.findById(containerId);
    

    if(!container){
      const err = new Error("Nie znaleziono kontenera ktory chcesz przeniesc");
      err.statusCode = 404;
      throw err;
    }

    const session = await Session.findById(container.session);

    if(!session){
      const err = new Error("Nie znaleziono sesji do której chcesz przenieść");
      err.statusCode = 404;
      throw err;
    }


    //sprawdzam czy mam uprawnienia
    const foundProject  = await ProjectEntry.findById(container.project);
    foundProject.checkPermission(req.userId);


    const userId = req.userId;
    const projectId = container.project;
    const sessionIdFROM = container.session;
    const containerFolderName = utils.getFileNameWithNoExt(container.fileName);



    //aktualizuje w bazie danych
    container.session = sessionIdTo;
    await container.save();

    //return ProjectEntry.findByIdAndUpdate(projectId,{$push: {sessionIds: createdSession._id}});
    await Session.findByIdAndUpdate(sessionIdFROM,{$pull: {containersIds: containerId}});
    await Session.findByIdAndUpdate(sessionIdTo,{$push: {containersIds: containerId}});

    //najpierw przenosze cały folder fizycznie z repo z jednego miejsca do drugiego
    const PathToContainerFROM = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionIdFROM + '/' + containerFolderName;
    const PathToContainerTO = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionIdTo + '/' + containerFolderName;

    //ostatecznie przenosze fizycznie
    fs.moveSync(PathToContainerFROM, PathToContainerTO,{overwrite: true});

    res.status(200).json({ message: 'Kontener został przeniesiony!', containerId: containerId, sessionId: sessionIdTo });

  } catch (error) {
    error.message = error.message || "Błąd przenoszenia kontenera do innej sesji";
    error.statusCode = error.statusCode || 500;
    next(error);
  }
}


/**
 * @api {get} /repoFiles/changeSessionName/:sessionId Zmiana nazwy sesji
 * @apiDescription Zmienia nazwę sesji
 * @apiName ChangeSessionName
 * @apiGroup Pliki
 *
 * @apiParam {String} sessionId id sesji której nazwe chcemy zmienić
 * @apiParam {String} newName nowa nazwa sesji
 * @apiHeader {String} Authorization Ciąg znaków 'Bearer token' gdzie w miejsce 'token' należy wstawić token uzyskany podczas logowania.
 *
 * @apiSuccess {String} message że zmiana przebiegła pomyślnie
 * @apiSuccess {String} sessionId id zmienianej sesji
 * @apiSuccess {String} newName nowa nazwa
 * 
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *        "message": "Zmiana nazwy sesji sukcesem!",
 *        "sessionId": "60ddf31aa715f3fd9b544c50",
 *        "newName": "zmienionaNazwa123"
 *     }
 * 
 * @apiError (404) NotFound nie znaleziono sesji o danym ID 
 * @apiError (500) InternalServerError Błąd serwera
 */

//refactoredOK
//##########################################
//#### zmieniam nazwe sesji ######
//#######################################

exports.changeSessionName = async (req, res, next) => {

  try {

    const sessionId = req.params.sessionId;
    const newName = req.body.newName;

    const foundSession = await Session.findById(sessionId);

    if(!foundSession){
      const err = new Error("Nie znaleziono sesji o podanym id");
      err.statusCode = 404;
      throw err;
    }

    const foundProject = await ProjectEntry.findById(foundSession.projectId);

    //sprawdzam czy mam uprawnienia
    await foundProject.checkPermission(req.userId);

    await Session.findByIdAndUpdate(sessionId,{name: newName});

    res.status(200).json({ message: 'Zmiana nazwy sesji sukcesem!', sessionId: sessionId, newName: newName });

  } catch (error) {
    error.message = error.message || "Błąd zmiany nazwy sesji";
    error.statusCode = error.statusCode || 500;
    next(error);
  }
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


//refactoredOK
//##########################################
//#### zmieniam nazwe contenera ######
//#######################################

exports.changeContainerName = async (req, res, next) => {

  try {

    const containerId = req.params.containerId;
    const newName = req.body.newName;

    const foundContainer = await Container.findById(containerId);

    if(!foundContainer){
      const err = new Error("Nie znalazłem kontenera o takim Id");
      err.statusCode = 404;
      throw err;
    }

    let owner = foundContainer.owner;

    //sprawdzam czy mam uprawnienia
    const foundProject = await ProjectEntry.findById(foundContainer.project);
    await foundProject.checkPermission(req.userId);

    const container = await Container.findByIdAndUpdate(containerId, { containerName: newName });

    res.status(200).json({ message: 'Zmiana nazwy zakończona sukcesem!', containerId: container._id, newName: newName });

  } catch (error) {
    error.message = error.message || "Błąd zmiany nazwy kontenera";
    error.statusCode = error.statusCode || 500;
    next(error);
  }
}


/**
 * @api {put} /repoFiles/runG2P' Uruchamia Graphen to Phonem (G2P)
 * @apiDescription Uruchamia usługę G2P
 * @apiName RunG2P
 * @apiGroup Narzędzia
 *
 * @apiParam {String} words słowa do tłumaczenia - każde w nowej linii
 * @apiParam {String} alphabet rodzaj alfabetu, może być alpha lub sampa lub ipa
 * @apiHeader {String} Authorization Ciąg znaków 'Bearer token' gdzie w miejsce 'token' należy wstawić token uzyskany podczas logowania.
 *
 * @apiSuccess {containerId} Identyfikator kontenera
 * @apiSuccess {newName} Nowa nazwa
 * 
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "message": 'G2P zakończone powodzeniem',
 *       "alphabet": "alpha",
 *       "g2pResults": "ala ma kota",
 *     }
 *
 * 
 * @apiError (500) ServerError 
 */

//refactored
exports.runG2P = async (req, res, next) => {

  const words = req.body.words;
  const alphabet = req.body.alphabet;

  if (!words) {
    const error = new Error('Nie przesłano słów do tłumaczenia');
    error.statusCode = 400;
    throw error;
  }


  try {

    //sprawdzam czy rzeczywiście mam uprawnienia do tego pliku
    const userToCheck = await User.findById(req.userId, "_id status");
    if ((userToCheck._id.toString() !== req.userId.toString()) || (userToCheck.status.toString() !== "Active")) {
      const error = new Error('Nie masz uprawnień!');
      error.statusCode = 403;
      throw error;
    }

    console.log(chalk.cyan("Uruchamiam G2P"));

    const g2pResults = await runTask.runG2P(words, alphabet, userToCheck);

    console.log(chalk.cyan("Zakończono G2P"));

    res.status(200).json({
      message: 'G2P zakończone powodzeniem',
      alphabet: alphabet,
      g2pResults: g2pResults,
  });


  } catch (error) {
    error.message = error.message || "Błąd G2P";
    error.statusCode = error.statusCode || 500;
    next(error);
  }
}


/**
 * @api {put} /repoFiles/runKWS/:containerId' Uruchamia keyword detection (KWS)
 * @apiDescription Uruchamia usługę KWS
 * @apiName RunKWS
 * @apiGroup Narzędzia
 *
 * @apiParam {String} containerId identyfikator kontenera na ktorym ma byc przeprowadzona usługa
 * @apiParam {String} keywords słowa kluczowe do wyszukania
 * @apiHeader {String} Authorization Ciąg znaków 'Bearer token' gdzie w miejsce 'token' należy wstawić token uzyskany podczas logowania.
 *
 * @apiSuccess {containerId} Identyfikator kontenera
 * @apiSuccess {newName} Nowa nazwa
 * 
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "message": 'KWS zakończone powodzeniem',
 *       "containerId": "60c4a68bbf17b2778c0b56be",
 *       "kwsResults": "celnik 0.74 0.22 -178.839",
 *     }
 *
 * 
 * @apiError (500) ServerError 
 */

//refactored
exports.runKWS = async (req, res, next) => {

  let containerId = req.params.containerId;
  const keywords = req.body.keywords;

  if (!containerId) {
    const error = new Error('Błądny parametr id kontenera');
    error.statusCode = 400;
    throw error;
  }

  let container = null;

  try {

    //validuje czy przekazany parametr jest poprawnym id
    if(!ObjectId.isValid(containerId)){
      const error = new Error('Błędne ID kontenera!');
      error.statusCode = 404;
      throw error;
    }
 
    container = await Container.findById(containerId);

    if(!container){
      const error = new Error('Błędne ID kontenera!');
      error.statusCode = 404;
      throw error;
    }


    //sprawdzam czy rzeczywiście mam uprawnienia 
    const foundProject = await ProjectEntry.findById(container.project);
    await foundProject.checkPermission(req.userId);
    

    console.log(chalk.cyan("Uruchamiam KWS dla " + containerId));

    const KWSResults = await runTask.runKWS(container,keywords);

    console.log(chalk.cyan("Zakończono KWS dla " + containerId));

    res.status(200).json({
      message: 'Wyszukiwanie Słów kluczowych zakończone powodzeniem',
      kwsResults: KWSResults,
      containerId: containerId
  });


  } catch (error) {
    error.message = error.message || "Błąd KWS";
    error.statusCode = error.statusCode || 500;
    next(error);
  }
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

//refactoredOK
 exports.runSpeechVAD = async (req, res, next) => {

  let containerId = req.params.containerId;

  if (!containerId) {
    const error = new Error('Błądny parametr id kontenera');
    error.statusCode = 400;
    throw error;
  }

  let container = null;

  try {

    container = await Container.findById(containerId);

    //sprawdzam czy rzeczywiście mam uprawnienia 
    const foundProject = await ProjectEntry.findById(container.project);
    await foundProject.checkPermission(req.userId);

    console.log(chalk.cyan("Uruchamiam detekcje mowy dla " + containerId));


    const VADsegments = await runTask.runVAD(container);

    console.log(chalk.cyan("Zakończono detekcje mowy dla " + containerId));
    res.status(200).json({ message: 'Zakończono detekcję mowy!', containerId: containerId, toolType: "VAD", VADSegments: VADsegments});


  } catch (error) {
    
    error.message = error.message || "Błąd detekcji aktywacji mowy";
    error.statusCode = error.statusCode || 500;

    //wpisuje błąd do bazy danych
    if(container){
      container.statusVAD = 'error';
      container.errorMessage = error.message ;
      await container.save();
    }

    next(error);
  }
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

//refactored
 exports.runSpeechDiarization = async (req, res, next) => {

  const containerId = req.params.containerId;

  if (!containerId) {
    const error = new Error('Błądny parametr id kontenera');
    error.statusCode = 400;
    throw error;
  }

  let container = null;

  try {

    container = await Container.findById(containerId);

    //sprawdzam czy rzeczywiście mam uprawnienia 
    const foundProject = await ProjectEntry.findById(container.project);
    await foundProject.checkPermission(req.userId);

    console.log(chalk.cyan("Uruchamiam diaryzacje dla " + containerId));

    const DIAsegments = await runTask.runDIA(container);

    console.log(chalk.cyan("Zakończono Diaryzacje dla " + containerId));
    res.status(200).json({ message: 'Diaryzacja zakończona sukcesem!', containerId: containerId, toolType: "DIA",  DIAsegments: DIAsegments});

  } catch (error) {
    
    error.message = error.message || "Błąd diaryzacji";
    error.statusCode = error.statusCode || 500;

    //wpisuje błąd do bazy danych
    if(container){
      container.statusDIA = 'error';
      container.errorMessage = error.message ;
      await container.save();
    }


    next(error);
  }
 
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
 * 
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "message": 'Segmentacja została wykonana pomyślnie',
 *       "containerId": "5f58a92dfa006c8aed96f846",
 *       "toolType": "SEG",
 *     }
 *
 * @apiError (503) ServiceUnavailable Gdy coś pójdzie nie tak z usługą segmentacji
 * @apiError (500) ServerError 
 * 
 * 
 */

//refactored
exports.runSpeechSegmentation = async (req, res, next) => {

  const containerId = req.params.containerId;

  if (!containerId) {
    const error = new Error('Błądny parametr id kontenera');
    error.statusCode = 400;
    throw error;
  }

  let container = null;

  try {
   

    console.log(chalk.cyan("Uruchamiam segmentacje dla " + containerId));

    container = await Container.findById(containerId);

    //sprawdzam czy rzeczywiście mam uprawnienia 
    const foundProject = await ProjectEntry.findById(container.project);
    await foundProject.checkPermission(req.userId);

    //container musi mieć najpierw wgraną transkrypcje
    if(container.ifREC === false){
      const error = new Error("Brak wgranej transkrypcji");
      error.statusCode = 406;
      throw error;
  }

    const returnData = await runTask.runSEG(container);

    let updatedContainer = returnData.updatedContainer;

    console.log(chalk.cyan("Zakonczono segmentacje dla " + containerId));
    res.status(200).json({ message: 'Segmentacja została wykonana pomyślnie', containerId: updatedContainer._id, toolType: "SEG" });

  } catch (error) {
    
    error.message = error.message || "Błąd segmentacji";
    error.statusCode = error.statusCode || 500;

    if(container){
      container.statusSEG = 'error';
      container.errorMessage = error.message ;
      await container.save();
    }

    next(error);
  }
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

//refactored
exports.runSpeechRecognition = async (req, res, next) => {

  const containerId = req.params.containerId;

  if (!containerId) {
    const error = new Error('Błądny parametr id kontenera');
    error.statusCode = 400;
    throw error;
  }

  let container = null;

  try {

    container = await Container.findById(containerId);

    //sprawdzam czy rzeczywiście mam uprawnienia 
    const foundProject = await ProjectEntry.findById(container.project);
    await foundProject.checkPermission(req.userId);

    console.log(chalk.cyan("Uruchamiam rozpoznawanie mowy dla " + containerId));


    const updatedContainer = await runTask.runREC(container);

    //Tutaj dorobić sprawdzanie czasu ile można czekać na zakończenie....

    console.log(chalk.cyan("Zakończono rozpoznawanie mowy dla: " + containerId));
    res.status(200).json({ message: 'Rozpoznawanie mowy zostało zakończone!', containerId: updatedContainer._id, toolType: "REC" });

  } catch (error) {

    
    error.message = error.message || "Błąd rozpoznawania mowy"
    error.statusCode = error.statusCode || 500;

    if(container){
      container.statusREC = 'error';
      container.errorMessage = error.message ;
      await container.save();
    }

    
    next(error);
  }
}


 
/**
 * @api {GET} /repoFiles/download/:containerId/:fileType Pobierz wyniki
 * @apiDescription Za pomocą tego zapytania możesz pobrać efekty pracy narzędzi automatycznych. Oprócz tego możesz pobrać oryginalnie wgrany plik oraz plik przekonwertowany do formatu WAV 16000 Hz, 16bits.
 * @apiName GETOutputFile
 * @apiGroup Pliki
 *
 * @apiParam {String} containerId   Identyfikator kontenera dla którego chcesz pobrać wynik. 
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

//refactoredOK
// ###################################################
// ########### pobieram plik z repozytorium użytkownika
// ######################################################
exports.getFileFromContainer = async (req, res, next) => {

  try {

    const containerId = req.params.containerId;
    const fileType = req.params.fileType;

    if (!containerId) {
      const error = new Error('Brak id kontenera');
      error.statusCode = 400;
      throw error;
    }

    if (!fileType) {
      const error = new Error('Brak typu pliku do pobrania');
      error.statusCode = 400;
      throw error;
    }

    const container = await Container.findById(containerId);

    if (!container) {
      const error = new Error('Nie znaleziono kontenera o danym ID');
      error.statusCode = 404;
      throw error;
    }

    const userId = container.owner;
    const projectId = container.project;
    const sessionId = container.session;

    //sprawdzam czy rzeczywiście mam uprawnienia 
    const foundProject = await ProjectEntry.findById(projectId);
    await foundProject.checkPermission(req.userId);

    //sciezka do pliku dat
    const repoPath = appRoot + "/repo/" + userId + "/" + projectId + "/" + sessionId;

    const containerFolderName = utils.getFileNameWithNoExt(container.fileName);
    const fileAudioName = container.fileName;
    const fileDatName = utils.getFileNameWithNoExt(container.fileName) + ".dat";

    let filename = '';

    //sprawdzam o jaki typ pliku mi chodzi
    let filePath = '';


    switch (fileType) {
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
        const DIActmFile = utils.getFileNameWithNoExt(container.fileName) + "_DIA.ctm";
        filePath = repoPath + "/" + containerFolderName + "/" + DIActmFile;
        filename = DIActmFile;
        break;
      case "DIAtextGrid":
        const DIAtextGrid = utils.getFileNameWithNoExt(container.fileName) + "_DIA.textGrid";
        filePath = repoPath + "/" + containerFolderName + "/" + DIAtextGrid;
        filename = DIAtextGrid;
        break;
      case "DIAJSON":
        const DIAJSON = utils.getFileNameWithNoExt(container.fileName) + "_DIA.json";
        filePath = repoPath + "/" + containerFolderName + "/" + DIAJSON;
        filename = DIAJSON;
        break;
      case "VADctm":
        const VADctmFile = utils.getFileNameWithNoExt(container.fileName) + "_VAD.ctm";
        filePath = repoPath + "/" + containerFolderName + "/" + VADctmFile;
        filename = VADctmFile;
        break;
      case "VADtextGrid":
        const VADtextGrid = utils.getFileNameWithNoExt(container.fileName) + "_VAD.textGrid";
        filePath = repoPath + "/" + containerFolderName + "/" + VADtextGrid;
        filename = VADtextGrid;
        break;
      case "SEGctm":
        const SEGctmFile = utils.getFileNameWithNoExt(container.fileName) + "_SEG.ctm";
        filePath = repoPath + "/" + containerFolderName + "/" + SEGctmFile;
        filename = SEGctmFile;
        break;
      case "SEGtextGrid":
        const SEGtextGrid = utils.getFileNameWithNoExt(container.fileName) + "_SEG.textGrid";
        filePath = repoPath + "/" + containerFolderName + "/" + SEGtextGrid;
        filename = SEGtextGrid;
        break;
      case "VADJSON":
        const VADJSON = utils.getFileNameWithNoExt(container.fileName) + "_VAD.json";
        filePath = repoPath + "/" + containerFolderName + "/" + VADJSON;
        filename = VADJSON;
        break;
      case "JSONTranscript":
        const JSONTranscript = utils.getFileNameWithNoExt(container.fileName) + ".json";
        filePath = repoPath + "/" + containerFolderName + "/" + JSONTranscript;
        filename = JSONTranscript;
        break;
      case "TXTTranscript":
        const TXTTranscript = utils.getFileNameWithNoExt(container.fileName) + "_TXT.txt";
        filePath = repoPath + "/" + containerFolderName + "/" + TXTTranscript;
        filename = TXTTranscript;
        break;
      case "EMUJSON":
        const EMUJSON = utils.getFileNameWithNoExt(container.fileName) + "_annot.json";
        filePath = repoPath + "/" + containerFolderName + "/" + EMUJSON;
        filename = EMUJSON;
        break;
      default:
        const error = new Error("Nie rozpoznano typu wyjścia");
        error.statusCode = 404;
        throw error;
    }

    if (fs.existsSync(filePath)) {
      res.download(filePath, filename);
    } else {
      const err = new Error("Plik tego typu nie istnieje!");
      throw err;
    }

  } catch (error) {
      error.statusCode = error.statusCode || 500;
      error.message = error.message || "Błąd pobierania pliku";
      next(error);
  }

}



/**
 * @api {delete} /repoFiles/deleteSession/:sessionId  Usuwanie sesji
 * @apiDescription Usuwa sesje wraz z jej zawartością
 * @apiName DELETESession
 * @apiGroup Pliki
 *
 * @apiParam {String} sessionId Id usuwanej sesji
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
 * @apiError (404) NotFound Sesji nie znaleziono
 * @apiError (400) BadRequest Błędne zapytanie
 * @apiError (500) InternalServerError Błąd serwera
 * 
 */

//##########################################
//#### usuwanie sesji
//#######################################
//refactoredOK

exports.removeSession = async (req,res,next) => {

  try {

      const sessionId = req.params.sessionId;

      if (!sessionId) {
        const error = new Error('Brak parametru id sesji');
        error.statusCode = 400;
        throw error;
      }

      const foundSession = await Session.findById(sessionId);

      if(!foundSession){
        const error = new Error("Nie znaleziono tej sesji");
        error.statusCode = 404;
        throw error;
      }

      const containersInThisSession = foundSession.containersIds;
      const projectId = foundSession.projectId;

      //sprawdzam czy mam uprawnienia
      const foundProject = await ProjectEntry.findById(projectId);
      await foundProject.checkPermission(req.userId);
      
      //usuwam z projektu odniesienia do usuwanem sesji
      await ProjectEntry.findByIdAndUpdate(projectId, {$pull: {sessionIds: sessionId}});

      //usuwam sama sesje
      await Session.findByIdAndRemove(sessionId);

      //usuwam kontenery ktore do niej należały
      await Container.deleteMany({_id: containersInThisSession});
      
      //usuwam pliki które przynależały do tej sesji
      const sessionPath = appRoot + "/repo/" + req.userId + "/" + projectId + "/" + sessionId;
      fs.removeSync(sessionPath);

      res.status(200).json({ message: 'Sesja została usunięta', sessionId: sessionId});

  } catch (error) {
      error.statusCode = error.statusCode || 500;
      error.message = error.message || "Błąd usuwania sesji";
      next(error);
  }
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
 * @apiSuccess {String} containerId  Id kontenera który został usunięty
 * @apiSuccess {String} sessionId  Id sesji do której należy kontener
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
 * @apiError (404) NotFound Nie znaleziono kontenera o danym Id
 * @apiError (500) InternalServerError Bład serwera 
 * 
 */

//refactoredOK
//##########################################
//#### usuwanie pojedynczego kontenera z repo ######
//##########################################
exports.removeContainer = async (req, res, next) => {

  try {

    const containerId = req.params.containerId;

    if (!containerId) {
      const error = new Error('Brak parametru id contenera');
      error.statusCode = 400;
      throw error;
    }

    const foundContainer = await Container.findById({ _id: containerId });

    if (!foundContainer) {
      const error = new Error('Nie znaleziono kontenera o danym ID');
      error.statusCode = 404;
      throw error;
    }

    const userId = foundContainer.owner;
    const projectId = foundContainer.project;
    const sessionId = foundContainer.session;

    //sprawdzam uprawnienia
    const foundProject = await ProjectEntry.findById(projectId);
    await foundProject.checkPermission(req.userId);

    //usuwam z bazy danych
    await Container.findByIdAndRemove(containerId);

    //usuwam odniesienie w kolekcji sesji
    await Session.findByIdAndUpdate(sessionId, { $pull: { containersIds: containerId } },{new: true});

    //usuwam fizycznie z dysku
    const conainerFolder = utils.getFileNameWithNoExt(foundContainer.fileName);
    const containerPath = appRoot + "/repo/" + userId + "/" + projectId + "/" + sessionId + "/" + conainerFolder;
    fs.removeSync(containerPath);

    res.status(200).json({ message: 'Kontener został usunięty!', sessionId: sessionId, containerId: containerId });

  } catch (error) {
      error.statusCode = error.statusCode || 500;
      error.message = error.message || "Błąd usuwania kontenera";
      next(error);
  }

}




/**
 * @api {post} /repoFiles/uploadFile Wgrywanie pliku
 * @apiDescription Wgranie pliku audio lub transkrypcji na serwer. W przypadku pliku audio należy podać id sesji do której wgrany będzie plik. W przypadku pliku transkrypcji (txt) należy podać dodatkowo id kontenera którego dotyczy.
 * @apiName UPLOADfile
 * @apiGroup Pliki
 *
 * @apiParam {String} projectId Id projektu
 * @apiParam {String} sessionId Id sesji
 * @apiParam {String} [containerId] Identyfikator kontenera. Potrzebny tylko jeżeli wgrywamy transkrypcje TXT. Jeżeli jest to plik audio, zostanie stworzony nowy kontener i ten parametr nie jest konieczny.
 * @apiParam {String} myFile Plik audio lub txt
 * @apiHeader {String} Authorization Ciąg znaków 'Bearer token' gdzie w miejsce 'token' należy wstawić token uzyskany podczas logowania.
 *
 * @apiSuccess {String} message Informacja o powodzeniu
 * @apiSuccess {String} containerId  ID kontenera który został został stworzony bądź do którego wgrano transkrypcje
 * @apiSuccess {String} sessionId  ID sesji do której należy kontener
 * @apiSuccess {String} oryginalName  nazwa wgranego pliku
 * 
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 201 Created
 *     {
 *       "message": 'Wgranie pliku zakończone powodzeniem!',
 *       "sessionId": "5f58a92dfa006c8aed96f846",
 *       "oryginalName": "sampleAudio.mp3"
 *       "containerId": "5f58a92dfa006c8aed96f847",
 *     }
 * 
 * @apiError (404) NotFound Nie znaleziono sesji podanym id
 * @apiError (400) BadRequest Brak pliku 
 * @apiError (500) InternalServerError Błąd serwera 
 * 
 */


//refactoredOK
//##########################################
//#### upload pojedynczego pliku do repo ###
//#######################################


exports.uploadFile = async (req, res, next) => {

  try {

    if (!req.file) {
      const error = new Error("Brak pliku");
      error.statusCode = 400;
      throw error
    }

    const savedFile = req.file.filename;                // już z unikatowym id
    const oryginalFileName = utils.sanitizeFileName(req.file.originalname);     //nazwa oryginalnego pliku
    let type = req.file.mimetype + "";
    let typeArray = type.split("/");                    //rozpoznaje czy audio czy txt po mimetype

    const sessionId = req.body.sessionId;
    const foundSession = await Session.findById(sessionId);

    if (!foundSession) {
      const error = new Error("Nie znaleziono sesji o podanym id");
      error.statusCode = 404;
      throw error
    }

    const foundProject = await ProjectEntry.findById(foundSession.projectId);
    const projectId = foundProject._id;

    //sprawdzam czy mamy uprawnienia
    await foundProject.checkPermission(req.userId);  

    const owner = foundProject.owner;
    const userId = owner;

    const fileWithNoExt = utils.getFileNameWithNoExt(savedFile);
    const fileWithNoSufix = fileWithNoExt.substring(0, fileWithNoExt.length - 5);

    const conainerFolderName = fileWithNoSufix;
    const containerFolderPath = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + conainerFolderName;
    const fullFilePath = containerFolderPath + "/" + savedFile;

    //jeżeli wgrywany plik to audio
    if (typeArray[0] == 'audio') {

      let process = new ffmpeg(fullFilePath);

      process.then(async audio => {

        //teraz robie konwersje na WAV i usuwam sufix _temp w docelowym pliku
        // musze tak robic bo zapisywanie w miejscu nie dziala przy dlugich plikach....

        const finalAudioFileName = conainerFolderName + ".wav";
        const fillCorrectAudioPath = containerFolderPath + "/" + finalAudioFileName;

        //console.log(fullFilePath)
        //console.log(fillCorrectAudioPath)

        audio.setAudioFrequency(16000)
          .setAudioChannels(1)
          .setAudioBitRate(256);

        audio.addCommand('-loglevel', 'warning');
        audio.addCommand('-y', '');
        audio.addCommand('-sample_fmt', 's16');


        //tworze odpowiednia nazwe kontenera - bez unikatowego ID oraz bez rozszerzenia
        await audio.save(fillCorrectAudioPath);



        //teraz zmieniam nazwe pliku na taki jaki był przesłany oryginalnie - usuwając unikatowe id i _temp.
        //Czyli przywracam plikowi oryginalna nazwe
        let tooryginal = utils.bringOryginalFileName(fullFilePath);

        const sizeConverted = Number(fs.statSync(fillCorrectAudioPath).size);
        const sizeOryginal = Number(fs.statSync(fullFilePath).size);

        //zapisuje tą informaje do DB
        let newContainer = new Container({
          fileName: finalAudioFileName,
          containerName: utils.getFileNameWithNoExt(oryginalFileName),
          oryginalFileName: utils.getFileNameFromPath(tooryginal),
          size: sizeConverted, //wielkosc przekonwertowanego pliku
          sizeOryginal: sizeOryginal, //wielkosc oryginalnego pliku
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

        fs.renameSync(fullFilePath, tooryginal);

        let ext = utils.getFileExtention(finalAudioFileName);
        ext = (ext[0] + '').toLowerCase();

        const finalDATFileName = conainerFolderName + ".dat";
        const fillCorrectDATPath = containerFolderPath + "/" + finalDATFileName;

        const shellcomm = 'audiowaveform -i ' + fillCorrectAudioPath + ' -o ' + fillCorrectDATPath + ' -z 32 -b 8 --input-format ' + ext;

        //obliczam z pliku audio podgląd dat
        if (shell.exec(shellcomm, { silent: true }).code !== 0) {
          shell.echo('Error: Problem with extracting dat for audio file');
          console.log(chalk.red('Error: Problem with extracting dat for audio file'));
          //shell.exit(1);
          const err = new Error('Error: Problem with extracting dat for audio file');
          throw err;
        } else {
          const createdContainer = await newContainer.save();
          await Session.findOneAndUpdate({ _id: sessionId }, {
            $push: {
              containersIds: {
                $each: [createdContainer._id], $position: 0
              }
            }
          });

          res.status(201).json({ 
            message: 'Wgranie pliku zakończone powodzeniem!', 
            sessionId: sessionId, 
            oryginalName: oryginalFileName, 
            containerId: createdContainer._id 
          })

        }
      }).catch(error => {
        error.message = "Problem z konwersją pliku";
        throw error;
      })

      //jeżeli jest wgrywany plik txt
    } else if (typeArray[0] == 'text') {

      const containerId = req.body.containerId;

      if(!containerId){
        const err = new Error("Brak id kontenera do którego wgrywamy plik");
        err.statusCode = 400;
        throw err;
      }

      
      const updatedContainer = await Container.findByIdAndUpdate(containerId, { ifREC: true, statusREC: 'done' });

      const oryginalFolderName = utils.getFileNameWithNoExt(updatedContainer.fileName);
      const sciezkaOryginalna = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + oryginalFolderName + '/' + savedFile;

      let fileWithNoExt = utils.getFileNameWithNoExt(savedFile);
      let fileWithNoSufix = fileWithNoExt.substring(0, fileWithNoExt.length - 5);

      const docelowaSciezka = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + oryginalFolderName + '/' + utils.getFileNameWithNoExt(updatedContainer.fileName) + '_TXT.txt';
      fs.moveSync(sciezkaOryginalna, docelowaSciezka, { overwrite: true });

      //zapisuje transkrypcje do pliku JSON
      const JSONtranscription = utils.convertTxtFileIntoJSON(docelowaSciezka);

      //zapisuje tego JSONA w katalogu containera
      const JSONTransPath = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + oryginalFolderName + '/' + utils.getFileNameWithNoExt(updatedContainer.fileName) + '.json';

      await fs.writeJson(JSONTransPath, JSONtranscription);

      //TO DO przerobienie tego na plik JSON - aby dało się podglądać

      res.status(201).json({ 
        message: 'Wgranie pliku zakończone powodzeniem!', 
        sessionId: sessionId, 
        oryginalName: oryginalFileName, 
        containerId: updatedContainer._id 
      });

    }

  } catch (error) {
      error.statusCode = error.statusCode || 500;
      error.message = error.message || "Błąd wgrywania pliku";
      next(error);
  }

}


/**
 * @api {post} /repoFiles/createNewSession/:projectId  Tworzenie sesji
 * @apiDescription Tworzy nową sesje (folder) w istniejącym projekcie
 * @apiName CREATESession
 * @apiGroup Pliki
 *
 * @apiParam {String} sessionName Nazwa nowo tworzonej sesji
 * @apiParam {String} projectId Identyfikator projektu w którym ma być stworzona sesja
 * @apiHeader {String} Authorization Ciąg znaków 'Bearer token' gdzie w miejsce 'token' należy wstawić token uzyskany podczas logowania.
 *
 * @apiSuccess {String} message wiadomość że 'Nowa sesja została utworzona!'
 * @apiSuccess {String} sessionName  Nazwa nowo stworzonej sesji
 * @apiSuccess {String} id  ID nowo stworzonej sesji
 * 
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 201 OK
 *     {
 *       "message": 'Nowa sesja została utworzona!',
 *       "sessionName": "Nowa sesja",
 *       "id": "5f58a92dfa006c8aed96f846",
 *     }
 * 
 * @apiError (400) BadRequest Błędne zapytanie
 * @apiError (500) InternalServerError Błąd serwera
 * 
 */

//refactoredOK
exports.createNewSession = async (req, res, next) => {

  try {

    const sessionName = req.body.sessionName;
    const projectId = req.params.projectId;

    if (!sessionName) {
      const error = new Error("Brak nazwy sesji");
      error.statusCode = 400;
      throw error
    }

    if (!projectId) {
      const error = new Error("Brak id projektu");
      error.statusCode = 400;
      throw error
    }

    
    const givenProject = await ProjectEntry.findById(projectId);

    //sprawdzam czy mam uprawnienia do tworzenia sesji w tym projekcie
    await givenProject.checkPermission(req.userId);

    const newSessionId = await createNewSessionHandler(sessionName, projectId);

    res.status(201).json({ message: 'Nowa sesja została utworzona!', sessionName: sessionName, id: newSessionId });

  } catch (error) {
    error.statusCode = error.statusCode || 500;
    error.message = error.message || "Błąd tworzenia nowej sesji";
    next(error);
  }
}


/**
 * @api {get} /repoFiles/getProjectAssets/:projectId Zawartość repozytorium
 * @apiDescription Zapytanie zwraca zawartość danego projektu w postaci listy sesji oraz kontenerów
 * @apiName GETrepoassets
 * @apiGroup Pliki
 *
 * @apiParam {String} projectId Identyfikator projektu 
 * @apiHeader {String} Authorization Ciąg znaków 'Bearer token' gdzie w miejsce 'token' należy wstawić token uzyskany podczas logowania.
 *
 * @apiSuccess {String} message Pliki dla tego projektu zostały pobrane!
 * @apiSuccess {String} corpusCreatedAt Data ostatnio stworzonego korpusu z danego projektu
 * @apiSuccess {Array} sessions  Lista sesji
 * @apiSuccess {Array} containers  Lista kontenerów
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "message": 'Nowa sesja została utworzona!',
 *       "corpusCreatedAt": "2021-04-03 12:03:33 pm"
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
 *  *            "RECUserSegments": [],
 *            "SEGUserSegments": [],
 *            "__v": 0,
 *            "createdAt": "2020-12-18T17:37:21.828Z",
 *            "updatedAt": "2020-12-18T17:37:21.828Z"
 *        }]
 *     }
 * 
 * @apiError (400) BadRequest Błędne zapytanie 
 * @apiError (500) IntenalServerError Błąd serwera
 * 
 * 
 */



//refactoredOK
//#######################################################
//################ pobieram assety użytkownika ##########
//#########################################################

exports.getRepoAssets = async (req, res, next) => {

  try {

    const projectId = req.params.projectId;

    if (!projectId) {
      const error = new Error('Błądny parametr id projektu');
      error.statusCode = 400;
      throw error;
    }

    const znalezionyProjekt = await ProjectEntry.findById(projectId);

    //sprawdzam czy mam uprawnienia
    await znalezionyProjekt.checkPermission(req.userId);

    //wydobywam liste sesji
    let sessionIds = znalezionyProjekt.sessionIds;
    const listaSesji = await Session.find({ _id: sessionIds }).sort({ 'createdAt': -1 });

    const sessionList = listaSesji.map(sesja => {
      return ({
        id: sesja._id,
        sessionName: sesja.name,
        ifSelected: false,
        containers: sesja.containersIds,
      });
    })

    const containerList = await Container.find({ owner: req.userId, project: projectId }).sort({ 'createdAt': -1 });

    //zwracam też dodatkową informacje o ostatnim czasie kiedy był stworzony korpus
    let corpusCreatedAt = null;

    if(znalezionyProjekt.corpusCreatedAt){
      corpusCreatedAt =  moment(znalezionyProjekt.corpusCreatedAt).format("YYYY-MM-DD, h:mm:ss a");
    }

    res.status(200).json({ 
      message: 'Pliki dla tego projektu zostały pobrane!', 
      sessions: sessionList, 
      containers: containerList, 
      corpusCreatedAt: corpusCreatedAt })
  } catch (error) {
      error.statusCode = error.statusCode || 500;
      error.message = error.message || "Błąd pobierania zawartości repozytorium"
      next(error);
  }
}




/**
 * @api {get} /repoFiles/getContainerInfo/:containerId  Info kontenera
 * @apiDescription Zwraca metadane danego kontenera
 * @apiName GetContainerInfo
 * @apiGroup Pliki
 *
 * @apiParam {String} containerId Identyfikator kontenera
 * @apiHeader {String} Authorization Ciąg znaków 'Bearer token' gdzie w miejsce 'token' należy wstawić token uzyskany podczas logowania.
 *
 * @apiSuccess {Object} repoStats statystyki użycia repozytorium
 * 
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *         {
 *             "container": {
 *                 "ifVAD": false,
 *                 "ifDIA": false,
 *                 "ifREC": false,
 *                 "ifSEG": false,
 *                 "errorMessage": "",
 *                 "_id": "60df2e582978b3ba4d8303d8",
 *                 "fileName": "testowyplik-f5001650.wav",
 *                 "containerName": "testowyplik",
 *                 "oryginalFileName": "testowyplik.mp3",
 *                 "size": 2694606,
 *                 "sizeOryginal": 168408,
 *                 "owner": "60ddca14f2e04bbdec0aa893",
 *                 "project": "60df2e392978b3ba4d8303d0",
 *                 "session": "60df2e4d2978b3ba4d8303d7",
 *                 "statusVAD": "ready",
 *                 "statusDIA": "ready",
 *                 "statusREC": "ready",
 *                 "statusSEG": "ready",
 *                 "VADUserSegments": [],
 *                 "DIAUserSegments": [],
 *                 "RECUserSegments": [],
 *                 "SEGUserSegments": [],
 *                 "createdAt": "2021-07-02T15:18:48.730Z",
 *                 "updatedAt": "2021-07-02T15:18:48.730Z",
 *             }
 *         }
 *    }
 * 
 * @apiError (400) BadRequest Błędne zapytanie
 * @apiError (500) InternalServerError Błąd serwera
 * 
 */

exports.getContainerInfo =  async (req, res, next) => {
  try {

    const containerId = req.params.containerId;

    if (!containerId) {
      const error = new Error('Błądny parametr id kontenera');
      error.statusCode = 400;
      throw error;
    }

    const foundContainer = await Container.findById(containerId);

    if (!foundContainer) {
      const error = new Error('Nie znaleziono takiego kontenera');
      error.statusCode = 404;
      throw error;
    }

    const znalezionyProjekt = await ProjectEntry.findById(foundContainer.project);

    //sprawdzam czy mam uprawnienia
    await znalezionyProjekt.checkPermission(req.userId);

    res.status(200).json({container: foundContainer})

  } catch (error) {
    error.statusCode = error.statusCode || 500;
    error.message = error.message || "Błąd pobierania zawartości repozytorium"
    next(error);
  }
}

/**
 * @api {get} /repoFiles/getRepoStats/:projectId  Statystyki repozytorium
 * @apiDescription Zwraca statystyki użycia repozytorium
 * @apiName GetRepoStats
 * @apiGroup Pliki
 *
 * @apiParam {String} projectId Identyfikator projektu
 * @apiHeader {String} Authorization Ciąg znaków 'Bearer token' gdzie w miejsce 'token' należy wstawić token uzyskany podczas logowania.
 *
 * @apiSuccess {Object} repoStats statystyki użycia repozytorium
 * 
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *        "repoStats": {
 *            "containersNumber": 7,
 *            "weightOfOryginal": 2884128,
 *            "weightOfConverted": 1855274,
 *            "totalWeight": 4739402
 *        }
 *    }
 * 
 * @apiError (400) BadRequest Błędne zapytanie
 * @apiError (500) InternalServerError Błąd serwera
 * 
 */

//refactoredOK
exports.getRepoStats = async (req, res, next) => {

  
  try {

    const projectId = req.params.projectId;

    if (!projectId) {
      const error = new Error('Błądny parametr id projektu');
      error.statusCode = 400;
      throw error;
    }

    const foundProject = await ProjectEntry.findById(projectId);

    if (!foundProject) {
      const noProjectErr = new Error("Nie znaleziono tego projektu");
      throw noProjectErr;
    }

    let userId = req.userId;

    //sprawdzam czy mam uprawnienia
    await foundProject.checkPermission(userId);

    //znajduje kontenery użytkownika i pobieram statystyki
    const foundContainers = await Container.find({ owner: userId, project: projectId });

    const mappedConverted = foundContainers.map(element => {
      return Number(element.size)
    });

    const mappedOryginal = foundContainers.map(element => {
      return Number(element.sizeOryginal)
    });

    const containersNumber = mappedConverted.length;

    let weightOfOryginal = 0;
    let weightOfConverted = 0;
    let totalWeight = 0;

    if (containersNumber > 0) {
      weightOfOryginal = mappedOryginal.reduce((total, value) => {
        return (total + value)
      });


      weightOfConverted = mappedConverted.reduce((total, value) => {
        return (total + value)
      });

      totalWeight = weightOfOryginal + weightOfConverted;
    }

 

    const dataToReturn = {
      containersNumber: containersNumber,
      weightOfOryginal: weightOfOryginal,
      weightOfConverted: weightOfConverted,
      totalWeight: totalWeight,
    }

    res.status(200).json({ repoStats: dataToReturn });

  } catch (error) {
    error.statusCode = error.statusCode || 500;
    error.message = error.message || "Błąd pobierania statystyk repozytorium";
    next(error);
  }


}