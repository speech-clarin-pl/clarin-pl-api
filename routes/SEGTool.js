const express = require('express');
const segToolController = require('../controllers/SEGTool');

const router = express.Router();

// GET /SEG/openInEMU/:containerId
router.get('/openInEMU/:containerId', segToolController.openContainerInEmu);


module.exports = router;