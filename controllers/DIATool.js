
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

exports.saveSegments = (req, res, next) => {

    console.log("Zapisuje DIA Segmenty")
    let segmentsTemp = req.body.segments;
    const toolType = req.body.toolType;
    const container = req.body.container;

    const segments = segmentsTemp.map(segment=>{
        return {
            startTime: Number(segment.startTime),
            endTime: Number(segment.endTime),
            editable: true,
            color: '#394b55',
            labelText: segment.labelText,
        }
    })

    const userId = container.owner;
    const projectId = container.project;
    const sessionId = container.session;

    const containerName = utils.getFileNameWithNoExt(container.fileName);
    const DIAFileName_CTM = utils.getFileNameWithNoExt(container.fileName) + '_DIA.ctm';
    const DIAFileName_JSON = utils.getFileNameWithNoExt(container.fileName) + '_DIA.json';

    const DIAFilePath_CTM = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + containerName + '/' + DIAFileName_CTM;
    const DIAFilePath_JSON = appRoot + '/repo/' + userId + '/' + projectId + '/' + sessionId + '/' + containerName + '/' + DIAFileName_JSON;

    //TO DO - tutaj zrobić update segmentow na serwerze
    //Przykładowy format to: input 1 1.310 6.500 speech

    //dodatkowo jest też plik JSOM - jego też musze zrobić update

    //zapisuje JSCON
    fs.writeJsonSync(DIAFilePath_JSON, segments);

    let newdata = "";
    for(let i=0;i<segments.length;i++){
        newdata = newdata + 'input 1 ' + segments[i].startTime + ' ' + segments[i].endTime + ' speech\n'
    }

    //zapisuje CTM
    fs.writeFileSync(DIAFilePath_CTM, newdata);

    Container.findByIdAndUpdate(container._id,{DIAUserSegments: segments})
        .then(updated => {
   
           //tutaj na nowo formatuje plik i go zapisuje 
   
           res.status(201).json({
               message: 'segments saved with success!',
               updatedSegments: segments,
           });
        })

}


