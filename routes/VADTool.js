const express = require('express');
const vadToolController = require('../controllers/VADTool');

const router = express.Router();

// PUT /VAD/singleFile
router.put('/saveSegments', vadToolController.saveSegments);


module.exports = router;