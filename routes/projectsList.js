const express = require('express');
const { body } = require('express-validator/check'); // for validation

const isAuth = require('../middleware/is-auth');

const projectsListController = require('../controllers/projectsList');

const router = express.Router();

// odbieranie listy projektow GET projects/
router.get('', isAuth, projectsListController.getProjectsList);

//usuwanie projektu
router.delete('/removeProject/:projectId',isAuth,projectsListController.deleteProject);

// tworzenie nowego projektu POST projects/
//z prosciutka validacja
router.post('/addProject', isAuth ,[
    body('projectName')
        .trim()
        .isLength({min: 1, max: 100 }),
], projectsListController.createProject);

//update projektu PUT
router.put('/updateProjectName/:projectId', isAuth, [
    body('newProjectName')
        .trim()
        .isLength({ min: 1, max: 100 })
],projectsListController.updateProjectName);



module.exports = router;