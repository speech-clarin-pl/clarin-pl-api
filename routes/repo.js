const express = require('express');
const repoController = require('../controllers/repoPanel');  // poprzednia wersja to była repo
const router = express.Router();
const isAuth = require('../middleware/is-auth');

//POST /repoFiles/uploadFile  - wysyłam pojedynczy plik
router.post('/uploadFile', isAuth, repoController.uploadFile);

//PUT /repoFiles/createNewSession  - tworze nową sesję
router.put('/createNewSession', isAuth, repoController.createNewSession);

// GET /repoFiles/projectId/userId - do pobierania listy plikow
router.get('/:projectId/:userId', isAuth, repoController.getRepoAssets);

 //DELETE /repoFiles/deleteFile/userId - usuwa folder
router.delete('/:userId/:projectId/:sessionId/:containerId', isAuth, repoController.removeContainer);


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