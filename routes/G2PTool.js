const express = require('express');
const G2PController = require('../controllers/G2PTool');

const router = express.Router();

// PUT /G2P/singleFile
router.put('/makeG2P', G2PController.makeG2P);


module.exports = router;