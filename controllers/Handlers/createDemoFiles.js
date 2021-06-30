const fs = require('fs');
const Container = require('../../models/Container')
var appRoot = require('app-root-path'); //zwraca roota aplikacji

module.exports = (ownerId, projectId, sessionId) => {


    const dirpath = appRoot + '/repo/'+ownerId+'/'+projectId;
    const pathToDemoSession = dirpath + '/' + sessionId;

    let celnikDemo = new Container({
        fileName: 'celnik-1189e21a.wav',
        containerName: 'celnik',
        oryginalFileName: 'celnik.wav',
        size: Number(fs.statSync(pathToDemoSession+"/celnik-1189e21a/celnik-1189e21a.wav").size),
        sizeOryginal: Number(fs.statSync(pathToDemoSession+"/celnik-1189e21a/celnik.wav").size),
        owner: ownerId,
        project: projectId,
        session: sessionId,
        ifVAD: true,
        ifDIA: true,
        ifREC: true,
        ifSEG: true,
        statusVAD: 'done',
        statusDIA: 'done',
        statusREC: 'done',
        statusSEG: 'done',
        VADUserSegments:  [{
            "startTime": 0.68,
            "endTime": 2.74,
            "editable": true,
            "color": "#394b55",
            "labelText": "speech"
        }, {
            "startTime": 2.74,
            "endTime": 5.97,
            "editable": true,
            "color": "#394b55",
            "labelText": "speech"
        }],
        DIAUserSegments:  [{
            "startTime": 0.68,
            "endTime": 2.74,
            "editable": true,
            "color": "#394b55",
            "labelText": "1"
        }, {
            "startTime": 2.74,
            "endTime": 4.62,
            "editable": true,
            "color": "#394b55",
            "labelText": "2"
        }, {
            "startTime": 4.62,
            "endTime": 5.97,
            "editable": true,
            "color": "#394b55",
            "labelText": "3"
        }],
        RECUserSegments: [],
        SEGUserSegments: [],
    });

    

    let kleskaDemo = new Container({
        fileName: 'kleska-29d61ce0.wav',
        containerName: 'kleska',
        oryginalFileName: 'kleska.wav',
        size: Number(fs.statSync(pathToDemoSession+"/kleska-29d61ce0/kleska-29d61ce0.wav").size),
        sizeOryginal: Number(fs.statSync(pathToDemoSession+"/kleska-29d61ce0/kleska.wav").size),
        owner: ownerId,
        project: projectId,
        session: sessionId,
        ifVAD: true,
        ifDIA: true,
        ifREC: false,
        ifSEG: false,
        statusVAD: 'done',
        statusDIA: 'done',
        statusREC: 'ready',
        statusSEG: 'ready',
        VADUserSegments: [{
            "startTime": 1.31,
            "endTime": 7.81,
            "editable": true,
            "color": "#394b55",
            "labelText": "speech"
        }],
        DIAUserSegments:  [{
            "startTime": 1.31,
            "endTime": 4.69,
            "editable": true,
            "color": "#394b55",
            "labelText": "3"
        }, {
            "startTime": 4.68,
            "endTime": 6.18,
            "editable": true,
            "color": "#394b55",
            "labelText": "1"
        }, {
            "startTime": 6.18,
            "endTime": 7.81,
            "editable": true,
            "color": "#394b55",
            "labelText": "2"
        }],
        RECUserSegments: [],
        SEGUserSegments: [],
    });

    
    let mowaDemo = new Container({
        fileName: 'mowa-b8c9e2fb.wav',
        containerName: 'mowa',
        oryginalFileName: 'mowa.wav',
        size: Number(fs.statSync(pathToDemoSession+"/mowa-b8c9e2fb/mowa-b8c9e2fb.wav").size),
        sizeOryginal: Number(fs.statSync(pathToDemoSession+"/mowa-b8c9e2fb/mowa.wav").size),
        owner: ownerId,
        project: projectId,
        session: sessionId,
        ifVAD: true,
        ifDIA: true,
        ifREC: true,
        ifSEG: true,
        statusVAD: 'done',
        statusDIA: 'done',
        statusREC: 'done',
        statusSEG: 'done',
        VADUserSegments:  [{
            "startTime": 0.54,
            "endTime": 4.66,
            "editable": true,
            "color": "#394b55",
            "labelText": "speech"
        }, {
            "startTime": 4.7,
            "endTime": 10.16,
            "editable": true,
            "color": "#394b55",
            "labelText": "speech"
        }],
        DIAUserSegments: [{
            "startTime": 0.54,
            "endTime": 2.42,
            "editable": true,
            "color": "#394b55",
            "labelText": "3"
        }, {
            "startTime": 2.42,
            "endTime": 4.66,
            "editable": true,
            "color": "#394b55",
            "labelText": "2"
        }, {
            "startTime": 4.7,
            "endTime": 5.83,
            "editable": true,
            "color": "#394b55",
            "labelText": "2"
        }, {
            "startTime": 5.83,
            "endTime": 8.82,
            "editable": true,
            "color": "#394b55",
            "labelText": "3"
        }, {
            "startTime": 8.82,
            "endTime": 10.16,
            "editable": true,
            "color": "#394b55",
            "labelText": "1"
        }],
        RECUserSegments: [],
        SEGUserSegments: [],
    });

    let opowiesciDemo = new Container({
        fileName: 'opowiesci-811cddd0.wav',
        containerName: 'opowiesci',
        oryginalFileName: 'opowiesci.wav',
        size: Number(fs.statSync(pathToDemoSession+"/opowiesci-811cddd0/opowiesci-811cddd0.wav").size),
        sizeOryginal: Number(fs.statSync(pathToDemoSession+"/opowiesci-811cddd0/opowiesci.wav").size),
        owner: ownerId,
        project: projectId,
        session: sessionId,
        ifVAD: true,
        ifDIA: false,
        ifREC: false,
        ifSEG: false,
        statusVAD: 'done',
        statusDIA: 'ready',
        statusREC: 'ready',
        statusSEG: 'ready',
        VADUserSegments: [{
            "startTime": 0.87,
            "endTime": 6.61,
            "editable": true,
            "color": "#394b55",
            "labelText": "speech"
        }],
        DIAUserSegments: [],
        RECUserSegments: [],
        SEGUserSegments: [],
    });

    let senatorDemo = new Container({
        fileName: 'senator-137ebd23.wav',
        containerName: 'senator',
        oryginalFileName: 'senator.wav',
        size: Number(fs.statSync(pathToDemoSession+"/senator-137ebd23/senator-137ebd23.wav").size),
        sizeOryginal: Number(fs.statSync(pathToDemoSession+"/senator-137ebd23/senator.wav").size),
        owner: ownerId,
        project: projectId,
        session: sessionId,
        ifVAD: true,
        ifDIA: true,
        ifREC: true,
        ifSEG: false,
        statusVAD: 'done',
        statusDIA: 'done',
        statusREC: 'done',
        statusSEG: 'ready',
        VADUserSegments:  [{
            "startTime": 0.12,
            "endTime": 7.73,
            "editable": true,
            "color": "#394b55",
            "labelText": "speech"
        }],
        DIAUserSegments:  [{
            "startTime": 0.12,
            "endTime": 3.5,
            "editable": true,
            "color": "#394b55",
            "labelText": "3"
        }, {
            "startTime": 3.5,
            "endTime": 5.75,
            "editable": true,
            "color": "#394b55",
            "labelText": "2"
        }, {
            "startTime": 5.75,
            "endTime": 6.5,
            "editable": true,
            "color": "#394b55",
            "labelText": "3"
        }, {
            "startTime": 6.5,
            "endTime": 7.73,
            "editable": true,
            "color": "#394b55",
            "labelText": "1"
        }],
        RECUserSegments: [],
        SEGUserSegments: [],
    });

    const demoFiles = [celnikDemo, kleskaDemo, mowaDemo, opowiesciDemo, senatorDemo];

    return demoFiles;
}