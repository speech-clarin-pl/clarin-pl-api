const express = require('express');
const diaToolController = require('../controllers/DIATool');

const router = express.Router();

// PUT /DIA/saveSegments
router.put('/saveSegments', diaToolController.saveSegments);


module.exports = router;