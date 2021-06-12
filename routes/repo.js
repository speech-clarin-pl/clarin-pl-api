const express = require('express');
const repoController = require('../controllers/repoPanel');  // poprzednia wersja to była repo
const audioEditorController = require('../controllers/audioEditor');  
const router = express.Router();
const isAuth = require('../middleware/is-auth');
const multerConfig = require('../middleware/multerConfig');

 //GET /repoFiles/:userId/:projectId/:sessionId/:containerId/:fileType - pobieram plik z repozytorium użytkownika
 //router.get('/:userId/:projectId/:sessionId/:containerId/:fileType', isAuth, repoController.getFileFromContainer);
 router.get('/download/:containerId/:fileType', isAuth, repoController.getFileFromContainer); //refactored
 
 // GET /repoFiles/loadAudioFile/REC/:containerId - dostarcza plik audio
 router.get('/loadAudioFile/:toolType/:containerId', isAuth, audioEditorController.loadAudioFile);//refactored

 // GET /repoFiles/loadContainerPreview/REC/:containerId - dostarcza metadane kontenera potrzebne do renderingu podglądu
 router.get('/loadBinaryAudio/:toolType/:containerId', isAuth, audioEditorController.loadBinaryAudio); //refactored

//POST /repoFiles/uploadFile  - wysyłam pojedynczy plik
router.post('/uploadFile', [isAuth, multerConfig ], repoController.uploadFile); //refactored

//POST /repoFiles/createNewSession  - tworze nową sesję
router.post('/createNewSession', isAuth, repoController.createNewSession); //refactored

//PUT /repoFiles/changeContainerName/:containerId
router.put('/changeContainerName/:containerId', isAuth, repoController.changeContainerName); //refactored

// GET /repoFiles/projectId - do pobierania listy plikow
router.get('/getProjectAssets/:projectId', isAuth, repoController.getRepoAssets); //refactored

//pobieranie statystyk o załadowanych plikach do repo
router.get('/getRepoStats/:projectId', isAuth, repoController.getRepoStats); //refactored

 //DELETE /repoFiles/delete/:containerId - usuwa container
router.delete('/delete/:containerId', isAuth, repoController.removeContainer); //refactored

 //DELETE /repoFiles/deleteFile/userId - usuwa sesje
 router.delete('/deleteSession/:sessionId', isAuth, repoController.removeSession); //refactored

 //PUT /repoFiles/runSpeechReco/containerId - wykonuje daną usługę na określonym kontenerze
 router.put('/runSpeechRecognition/:containerId', isAuth, repoController.runSpeechRecognition); //refactored

  //PUT /repoFiles/runSpeechReco/containerId - wykonuje daną usługę na określonym kontenerze
  router.put('/runSpeechSegmentation/:containerId', isAuth, repoController.runSpeechSegmentation); //refactored

  //PUT /repoFiles/runSpeechDiarization/containerId - wykonuje daną usługę na określonym kontenerze
  router.put('/runSpeechDiarization/:containerId', isAuth, repoController.runSpeechDiarization);

  //PUT /repoFiles/runSpeechVAD/containerId - wykonuje daną usługę na określonym kontenerze
  router.put('/runSpeechVAD/:containerId', isAuth, repoController.runSpeechVAD);

  //GET /repoFiles/exportToEmu/:userId/:projectId - exportuje do EMU
  //router.get('/exportToEmu/:userId/:projectId', isAuth, repoController.exportToEmu);
  router.get('/createCorpus/:projectId', isAuth, repoController.exportToEmu);
  //router.get('/createCorpus/', isAuth, repoController.exportToEmu);

   //GET /downloadKorpus/:userId/:projectId' - exportuje do EMU
   //router.get('/downloadKorpus/:userId/:projectId', isAuth, repoController.getReadyKorpus);
   router.get('/downloadCorpus/:projectId', isAuth, repoController.getReadyKorpus);
  // router.get('/downloadCorpus/', isAuth, repoController.getReadyKorpus);

  



// //POST /repoFiles/uploadFiles  - tworzy folder OK
// router.post('/uploadFiles', isAuth, repoController.uploadFiles);

// //POST /repoFiles/uploadFile  - wysyłam pojedynczy plik
// router.post('/uploadFile', isAuth, repoController.uploadFile);

// //POST /repoFiles/uploadAudio - customowy komponent do uploadu.
// router.post('/uploadAudio', isAuth, repoController.uploadAudio);

// //POST /repoFiles/createFolder  - tworzy folder OK
// router.post('/createFolder', isAuth, repoController.createFolder);

// //PUT /repoFiles/renameFolder/userId - do zmiany nazwy folderu OK
// router.put('/renameFolder/', isAuth, repoController.renameFolder);

// //PUT /repoFiles/moveFolder/projectId -  zmienia polozenia folderu OK
// //router.put('/moveFolder/:projectId', isAuth, repoController.moveFolder);

// //DELETE /repoFiles/deleteFolder/userId - usuwa folder OK
// router.delete('/deleteFolder/', isAuth, repoController.deleteFolder);

// //DELETE /repoFiles/deleteFile/userId - usuwa folder
// router.delete('/deleteFile/', isAuth, repoController.deleteFile);

// //DELETE /repoFiles/downloadFile/userId - usuwa folder
// router.get('/downloadFile/', isAuth, repoController.downloadFile);

// //PUT /repoFiles/renameFile/userId - do zmiany nazwy pliku
// router.put('/renameFile/', isAuth, repoController.renameFile);

// //PUT /repoFiles/editTxtFile/userId - do edycji pliku tekstowego
// router.put('/editTxtFile/', isAuth, repoController.editTxtFile);



//PUT /repoFiles/renameFile/userId - do zmiany nazwy pliku
//router.put('/moveFile/:projectId', isAuth, repoController.moveFile);


module.exports = router;