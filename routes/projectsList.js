const express = require('express');
const { body } = require('express-validator/check'); // for validation

const projectsListController = require('../controllers/projectsList');

const router = express.Router();

// odbieranie listy projektow GET projects/
router.get('', projectsListController.getProjectsList);

// tworzenie nowego projektu POST projects/
//z prosciutka validacja
router.post('', [
    body('projectName')
        .trim()
        .isLength({ min: 3 }),
], projectsListController.createProject);

//update projektu PUT
router.put('/:projectId',[
    body('projectName')
        .trim()
        .isLength({ min: 3 }),
],);

module.exports = router;