//importuje model wpisu projektu
const Task = require('../models/DockerTask');
const appRoot = require('app-root-path'); //zwraca roota aplikacji   
const utils = require('../utils/utils');
const moment = require('moment');
const fs = require('fs-extra');
const ProjectEntry = require('../models/projectEntry');
const ProjectFile = require('../models/projectFile');
const User = require('../models/user');

exports.runRECO = (inputAudio, outputFile) => {
    return new Promise((resolve, reject) => {
        // buduje wpis do bazy danych

         //tutaj uruchamiam task z dockera
        //  dockerTaskControllerOK.runTaskOK(
        //     "recognize",
        //     null,
        //     null,
        //     newOryginalName,
        //     null,
        //     userId,
        //     projectId,
        //     sentEntryId)

        //tworze nowy wpis w bazie za pomoca modelu
        const dockerTask = new Task({
            task: "recognize",
            in_progress: false,
            done: false,
            time: new Date().toUTCString(),
            input: inputAudio,
        });

        // uruchamiam usługę z dockera
        dockerTask.save()
            .then(savedTask => {
                resolve(savedTask)
            }).catch(error => {
                reject(error)
            })
    })
}





