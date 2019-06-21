const express = require('express');
const { body } = require('express-validator/check'); // for validation

const isAuth = require('../middleware/is-auth');

const projectsListController = require('../controllers/projectsList');

const router = express.Router();

// odbieranie listy projektow GET projects/
router.get('', isAuth, projectsListController.getProjectsList);

//usuwanie projektu
router.delete('/:projectId',isAuth,projectsListController.deleteProject);

// tworzenie nowego projektu POST projects/
//z prosciutka validacja
router.post('', isAuth ,[
    body('projectName')
        .trim()
        .isLength({min: 3 }),
], projectsListController.createProject);

//update projektu PUT
router.put('/:projectId', isAuth, [
    body('newProjectName')
        .trim()
        .isLength({ min: 3 }),
    body('projectId')
        .trim()
        .isLength({ min: 2 })
],projectsListController.updateProjectName);



module.exports = router;