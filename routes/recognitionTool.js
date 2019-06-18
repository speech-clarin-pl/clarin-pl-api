const express = require('express');
const recognitionToolController = require('../controllers/recognitionTool');

const router = express.Router();

// POST /recognition/singleFile
router.post('/singleFile', recognitionToolController.startFileRecognition);
router.post('/multipleFiles', recognitionToolController.startBatchRecognition);


module.exports = router;