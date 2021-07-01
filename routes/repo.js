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
router.post('/createNewSession/:projectId', isAuth, repoController.createNewSession); //refactored

//PUT /repoFiles/changeContainerName/:containerId
router.put('/changeContainerName/:containerId', isAuth, repoController.changeContainerName); //refactored

//PUT /repoFiles/changeSessionName/:sessionId
router.put('/changeSessionName/:sessionId', isAuth, repoController.changeSessionName); //refactored

//PUT /repoFiles/moveContainerToSession/:containerId
router.put('/moveContainerToSession/:containerId', isAuth, repoController.moveContainerToSession); //refactored

// GET /repoFiles/projectId - do pobierania listy plikow
router.get('/getProjectAssets/:projectId', isAuth, repoController.getRepoAssets); //refactored

//pobieranie statystyk o załadowanych plikach do repo
router.get('/getRepoStats/:projectId', isAuth, repoController.getRepoStats); //refactored

 //DELETE /repoFiles/delete/:containerId - usuwa container
router.delete('/delete/:containerId', isAuth, repoController.removeContainer); //refactored

 //DELETE /repoFiles/deleteFile/userId - usuwa sesje
 router.delete('/deleteSession/:sessionId', isAuth, repoController.removeSession); //refactored

 //PUT /repoFiles/runSpeechReco/containerId 
 router.put('/runSpeechRecognition/:containerId', isAuth, repoController.runSpeechRecognition); //refactored

  //PUT /repoFiles/runSpeechReco/containerId 
  router.put('/runSpeechSegmentation/:containerId', isAuth, repoController.runSpeechSegmentation); //refactored

  //PUT /repoFiles/runSpeechDiarization/containerId 
  router.put('/runSpeechDiarization/:containerId', isAuth, repoController.runSpeechDiarization); //refactored

  //PUT /repoFiles/runSpeechVAD/containerId 
  router.put('/runSpeechVAD/:containerId', isAuth, repoController.runSpeechVAD); //refactored

  //PUT /repoFiles/runSpeechVAD/containerId 
  router.put('/runKWS/:containerId', isAuth, repoController.runKWS);

  //PUT /repoFiles/runG2P
  router.put('/runG2P', isAuth, repoController.runG2P);
 
  //GET /repoFiles/exportToEmu/:userId/:projectId - exportuje do EMU
  router.get('/createCorpus/:projectId', isAuth, repoController.exportToEmu); //refactored
  //router.get('/createCorpus/', isAuth, repoController.exportToEmu);

   //GET /downloadKorpus/:userId/:projectId' - pobieram korpus
   router.get('/downloadCorpus/:projectId', isAuth, repoController.getReadyKorpus);


module.exports = router;