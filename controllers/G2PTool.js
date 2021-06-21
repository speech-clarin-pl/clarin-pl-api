
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

exports.makeG2P = (req, res, next) => {
    const alphabet = req.body.alphabet || 'alpha';
    const setOfWords = req.body.setOfWords || [];

    res.status(201).json({
        message: 'Transkrypcja zakonczona',
        transcribedWords: ["wyraz pierwszy", "wyraz drugi"],
        alphabet: alphabet
    });
}


