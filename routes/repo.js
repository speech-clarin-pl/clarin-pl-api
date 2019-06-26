const express = require('express');
const repoController = require('../controllers/repo');
const router = express.Router();
const isAuth = require('../middleware/is-auth');


// GET /repoFiles/userId - do pobierania listy plikow
router.get('/:projectId', isAuth, repoController.getRepoFiles);

//POST /repoFiles/createFolder  - tworzy folder OK
router.post('/createFolder', isAuth, repoController.createFolder);

//PUT /repoFiles/renameFolder/userId - do zmiany nazwy folderu OK
router.put('/renameFolder/', isAuth, repoController.renameFolder);

//PUT /repoFiles/moveFolder/projectId -  zmienia polozenia folderu OK
//router.put('/moveFolder/:projectId', isAuth, repoController.moveFolder);

//DELETE /repoFiles/deleteFolder/userId - usuwa folder OK
router.delete('/deleteFolder/', isAuth, repoController.deleteFolder);

//DELETE /repoFiles/deleteFile/userId - usuwa folder
router.delete('/deleteFile/', isAuth, repoController.deleteFile);

//PUT /repoFiles/renameFile/userId - do zmiany nazwy pliku
router.put('/renameFile/', isAuth, repoController.renameFile);

//PUT /repoFiles/renameFile/userId - do zmiany nazwy pliku
//router.put('/moveFile/:projectId', isAuth, repoController.moveFile);




module.exports = router;