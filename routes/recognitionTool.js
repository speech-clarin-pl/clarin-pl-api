const express = require('express');
const recognitionToolController = require('../controllers/recognitionTool');

const router = express.Router();

// POST /recognition/singleFile
//router.post('/singleFile', recognitionToolController.startFileRecognitionOK);

// GET /recognition/loadTranscription/containerId
router.get('/loadTranscription/:containerId', recognitionToolController.loadTranscription);

// PUT /recognition/saveTranscription
router.put('/saveTranscription', recognitionToolController.saveTranscription);


// POST /recognition/multipleFiles
//router.post('/multipleFiles', recognitionToolController.startBatchRecognition);


module.exports = router;