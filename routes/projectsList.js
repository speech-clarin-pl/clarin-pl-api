const express = require('express');
const { body } = require('express-validator/check'); // for validation

const projectsListController = require('../controllers/projectsList');

const router = express.Router();

// GET projects/
router.get('', projectsListController.getProjectsList);

// POST projects/
//z prosciutka validacja
router.post('', [
    body('projectName')
        .trim()
        .isLength({ min: 3 }),
], projectsListController.createProject);

module.exports = router;