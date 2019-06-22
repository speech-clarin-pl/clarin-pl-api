const express = require('express');
const repoController = require('../controllers/repo');
const router = express.Router();
const isAuth = require('../middleware/is-auth');


// GET /repo - do pobierania listy projektow
router.get('/:userId', isAuth, repoController.getRepoFiles);

module.exports = router;