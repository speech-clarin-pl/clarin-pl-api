const express = require('express');
const segmentationToolController = require('../controllers/segmentationTool');

const router = express.Router();

// POST /recognition/singleFile
router.post('/singleFile', segmentationToolController.startEntrySegmentation);


module.exports = router;