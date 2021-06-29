
//const dockerTaskController = require('./runTask');
//const dockerTaskControllerOK = require('./runTaskOK_');
const appRoot = require('app-root-path'); //zwraca roota aplikacji    
const fs = require('fs-extra');
const ProjectEntry = require('../models/projectEntry');
const ProjectFile = require('../models/projectFile');
const User = require('../models/user');
const utils = require('../utils/utils');
const ffmpeg = require('ffmpeg');
const Container = require('../models/Container')

/*
exports.makeKWS = (req, res, next) => {

    const setOfWords = req.body.setOfWords || [];
    const containerId = req.body.containerId;

    res.status(201).json({
        message: 'Wyszukiwanie Słów kluczowych zakończone powodzeniem',
        kwsResults: "tutaj jakieś rezultaty KWS",
        containerId: containerId
    });
}
*/


