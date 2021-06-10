const express = require('express');
const recognitionToolController = require('../controllers/recognitionTool');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

// GET /recognition/loadTranscription/containerId
router.get('/loadTranscription/:containerId', isAuth, recognitionToolController.loadTranscription); //refactored

// PUT /recognition/saveTranscription
router.put('/saveTranscription', isAuth, recognitionToolController.saveTranscription); //refactored

module.exports = router;