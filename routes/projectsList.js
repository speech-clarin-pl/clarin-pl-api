const express = require('express');

const projectsListController = require('../controllers/projectsList');

const router = express.Router();

// GET projects/
router.get('', projectsListController.getProjectsList);

// POST projects/
router.post('', projectsListController.createProject);

module.exports = router;