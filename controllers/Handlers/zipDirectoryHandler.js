const fs = require('fs-extra');
const path = require('path');
const ffmpeg = require('ffmpeg');
const mkdirp = require("mkdirp"); //do tworzenia folderu
const rimraf = require("rimraf");
const appRoot = require('app-root-path'); //zwraca roota aplikacji
const moment = require('moment');
const utils = require('../../utils/utils');
const config = require('../../config.js');
const ProjectEntry = require('../../models/projectEntry');
const Container = require('../../models/Container')
const Session = require('../../models/Session');
const ProjectFile = require('../../models/projectFile');
const User = require('../../models/user');
const IncomingForm = require('formidable').IncomingForm;
const uniqueFilename = require('unique-filename');
const shell = require('shelljs');
const {spawn} = require('child_process');
const chalk = require('chalk');
const emu = require('../emu');
const runTask = require('../runTask');
const archiver = require('archiver');

module.exports = (source, out) => {
    const archive = archiver('zip', { zlib: { level: 9 }});
    const stream = fs.createWriteStream(out);
  
    return new Promise((resolve, reject) => {
      archive
        .directory(source, false)
        .on('error', err => reject(err))
        .pipe(stream)
      ;
  
      stream.on('close', () => resolve());
      archive.finalize();
    });
  }