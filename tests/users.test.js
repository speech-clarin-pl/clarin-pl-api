const request = require('supertest');
const app = require('../appPre');
const config = require('../config');
const moment = require('moment');

const User = require('../models/user');
const Container = require('../models/Container');
const ProjectEntry = require('../models/projectEntry');
const Session = require('../models/Session');
const {
    userOneId, 
    userOne, 
    setupDatabase, 
    token,
} = require('./fixtures/db');

//przed każdym testem...
beforeEach(setupDatabase)

let defaultProject;
let defaultSession;
let demoSession;

let newProject;
let newDemoSession;
let newDefaultSession;

let newSession;
let newCon_celnik_mp3_160kbps_cbr;
let newCon_dlugie_MP3_160kbpm_cbr;
let newCon_kleska_MP3_64kbps_cbr;
let newCon_mowa;
let newCon_opowiesci_MP3_vbr;
let newCon_senator_ogg;


//##############################################################
//##############################################################
//############ Rejestracja i Logowanie #########################
//##############################################################
//##############################################################

test('Powinien zarejestrować nowego użytkownika oraz utworzyć domyślny projekt i sesje', async () =>{
    const response = await request(app).put('/auth/registration').send({
        email: 'kontakt@test.test',
        name: 'Mario',
        password: 'haslo123'
    }).expect(201);

    //sprawdzam czy zostal utworzony domyślny projekt i sesje w nim
    defaultProject = await ProjectEntry.findById(response.body.defaultProjectId);
    expect(defaultProject).not.toBeNull();
    defaultSession = await Session.findById(response.body.defaultSessionId);
    expect(defaultSession).not.toBeNull();
    demoSession = await Session.findById(response.body.demoSessionId);
    expect(demoSession).not.toBeNull();
})

test('NIE powinien zarejestrować nowego użytkownika gdy już istnieje', async () =>{
    const response = await request(app).put('/auth/registration').send({
        email: userOne.email,
        name: 'Mario',
        password: 'haslo12345678'
    }).expect(422);
})

test('Powinien zalogować istniejącego użytkownika i czy zwraca token', async () => {
    const response = await request(app).post('/auth/login').send({
        email: userOne.email,
        password: 'haslo123'
    }).expect(200);

    //sprawdzam czy zwraca poprawny token
    expect(response.body.token).not.toBeNull();
})

test('Nie powinien zalogować gdy błędny email oraz nie powinien zwracać tokenu', async () => {
    const response = await request(app).post('/auth/login').send({
        email: "blednyemail@gmail.com",
        password: 'haslo123'
    }).expect(404);

    //sprawdzam czy zwraca poprawny token
    expect(response.body.token).toBeUndefined();
})

test('Nie powinien zalogować gdy błędne hasło oraz nie powinien zwracać tokenu', async () => {
    const response = await request(app).post('/auth/login').send({
        email: userOne.email,
        password: 'haslo123ZLE'
    }).expect(401);

    //sprawdzam czy zwraca poprawny token
    expect(response.body.token).toBeUndefined();
})

/*
test('Powinien wysłać mail z linkiem do zresetowania hasła', async () => {
    const response = await request(app).post('/auth/forgotPass').send({
        email: userOne.email,
    }).expect(200);
})

test('NIE powinien maila z linkiem do resetu hasła jeżeli email jest błędny', async () => {
    const response = await request(app).post('/auth/forgotPass').send({
        email: userOne.email + "blad",
    }).expect(401);
})
*/

//##############################################################
//##############################################################
//### Zarządzanie projektami, sesjami oraz plikami #############
//##############################################################
//##############################################################


test('Powinien utworzyć nowy projekt dla zalogowanego użytkownika oraz dwie przykładowe sesje', async () => {
    const response = await request(app)
        .post('/projectsList/addProject')
        .set('Authorization', `Bearer ${token}`)
        .send({
            projectName: 'testProject'
        })
        .expect(201);

    newProject = await ProjectEntry.findById(response.body.project._id);
    expect(newProject).not.toBeNull();
    expect(newProject).not.toBeUndefined();

    newDemoSession = await Session.findById(newProject.sessionIds[0]);
    expect(newDemoSession).not.toBeNull();
    expect(newDemoSession).not.toBeUndefined();

    newDefaultSession = await Session.findById(newProject.sessionIds[1]);
    expect(newDefaultSession).not.toBeNull();
    expect(newDefaultSession).not.toBeUndefined();

});


test('NIE Powinien stworzyć nowego projektu dla nie zalogowanego użytkownika', async () => {
    const response = await request(app)
        .post('/projectsList/addProject')
        //.set('Authorization', `Bearer ${token}`)
        .send({
            projectName: 'testProject2'
        })
        .expect(401);
});

test('Powinien stworzyć nową sesje w stworzonym projekcie dla zalogowanego użytkownika', async () => {
    const response = await request(app)
        .post('/repoFiles/createNewSession')
        .set('Authorization', `Bearer ${token}`)
        .send({
            sessionName: 'Nowa Sesja',
            projectId: newProject._id
        })
        .expect(201);
    
    newSession = await Session.findById(response.body.id);
    expect(newSession).not.toBeNull();
    expect(newSession).not.toBeUndefined();
});

test('NIE powinien stworzyć nowej sesji dla nie zalogowanego użytkownika', async () => {
    const response = await request(app)
        .post('/repoFiles/createNewSession')
        //.set('Authorization', `Bearer ${token}`)
        .send({
            sessionName: 'Nowa Sesja',
            projectId: newProject._id
        })
        .expect(401);
});


test('Poninen wgrać 6 testowych plikow w różnych formatach do repozytoriu gdy użytkownik jest zalogowany i utworzyć dla nich kontenery', async () => {


    const res_celnik_mp3_160kbps_cbr = await request(app)
        .post('/repoFiles/uploadFile')
        .set('Authorization', `Bearer ${token}`)
        .field('projectId',newProject._id+"")
        .field('sessionId',newSession._id+"")
        .attach('myFile','tests/fixtures/celnik_mp3_160kbps_cbr.mp3')
        .expect(201);

    const res_dlugie_MP3_160kbpm_cbr = await request(app)
        .post('/repoFiles/uploadFile')
        .set('Authorization', `Bearer ${token}`)
        .field('projectId',newProject._id+"")
        .field('sessionId',newSession._id+"")
        .attach('myFile','tests/fixtures/dlugie_MP3_160kbpm_cbr.mp3')
        .expect(201);

    const res_kleska_MP3_64kbps_cbr = await request(app)
        .post('/repoFiles/uploadFile')
        .set('Authorization', `Bearer ${token}`)
        .field('projectId',newProject._id+"")
        .field('sessionId',newSession._id+"")
        .attach('myFile','tests/fixtures/kleska_MP3_64kbps_cbr.mp3')
        .expect(201);

    const res_mowa = await request(app)
        .post('/repoFiles/uploadFile')
        .set('Authorization', `Bearer ${token}`)
        .field('projectId',newProject._id+"")
        .field('sessionId',newSession._id+"")
        .attach('myFile','tests/fixtures/mowa.wav')
        .expect(201);

    const res_opowiesci_MP3_vbr = await request(app)
        .post('/repoFiles/uploadFile')
        .set('Authorization', `Bearer ${token}`)
        .field('projectId',newProject._id+"")
        .field('sessionId',newSession._id+"")
        .attach('myFile','tests/fixtures/opowiesci_MP3_vbr.mp3')
        .expect(201);

    const res_senator_ogg = await request(app)
        .post('/repoFiles/uploadFile')
        .set('Authorization', `Bearer ${token}`)
        .field('projectId',newProject._id+"")
        .field('sessionId',newSession._id+"")
        .attach('myFile','tests/fixtures/senator_ogg.ogg')
        .expect(201);

    newCon_celnik_mp3_160kbps_cbr = await Container.findById(res_celnik_mp3_160kbps_cbr.body.containerId);
    expect(newCon_celnik_mp3_160kbps_cbr).not.toBeNull();
    expect(newCon_celnik_mp3_160kbps_cbr).not.toBeUndefined();

    newCon_dlugie_MP3_160kbpm_cbr = await Container.findById(res_dlugie_MP3_160kbpm_cbr.body.containerId);
    expect(newCon_dlugie_MP3_160kbpm_cbr).not.toBeNull();
    expect(newCon_dlugie_MP3_160kbpm_cbr).not.toBeUndefined();

    newCon_kleska_MP3_64kbps_cbr = await Container.findById(res_kleska_MP3_64kbps_cbr.body.containerId);
    expect(newCon_kleska_MP3_64kbps_cbr).not.toBeNull();
    expect(newCon_kleska_MP3_64kbps_cbr).not.toBeUndefined();

    newCon_mowa = await Container.findById(res_mowa.body.containerId);
    expect(newCon_mowa).not.toBeNull();
    expect(newCon_mowa).not.toBeUndefined();

    newCon_opowiesci_MP3_vbr = await Container.findById(res_opowiesci_MP3_vbr.body.containerId);
    expect(newCon_opowiesci_MP3_vbr).not.toBeNull();
    expect(newCon_opowiesci_MP3_vbr).not.toBeUndefined();

    newCon_senator_ogg = await Container.findById(res_senator_ogg.body.containerId);
    expect(newCon_senator_ogg).not.toBeNull();
    expect(newCon_senator_ogg).not.toBeUndefined();
});


test('Powinien zmienić nazwę projektu dla zalogowanego użytkownika', async () => {
    const response = await request(app)
        .put('/projectsList/updateProjectName/'+newProject._id)
        .set('Authorization', `Bearer ${token}`)
        .send({
            newProjectName: 'Zmieniona nazwa projektu',
        })
        .expect(200);
});

test('NIE Powinien zmienić nazwę projektu dla nie zalogowanego użytkownika', async () => {
    const response = await request(app)
        .put('/projectsList/updateProjectName/'+newProject._id)
        //.set('Authorization', `Bearer ${token}`)
        .send({
            newProjectName: 'Zmieniona nazwa projektu2',
        })
        .expect(401);
});

test('Powinien zmienić nazwę kontenera dla zalogowanego użytkownika', async () => {
    console.log("AAA")
    console.log(newCon_mowa)
    const response = await request(app)
        .put('/repoFiles/changeContainerName/'+newCon_mowa._id)
        .set('Authorization', `Bearer ${token}`)
        .send({
            newName: 'mowaZmianaNazwy',
        })
        .expect(200);
});

test('NIE Powinien zmienić nazwę kontenera dla nie zalogowanego użytkownika', async () => {
    const response = await request(app)
        .put('/repoFiles/changeContainerName/'+newCon_mowa._id)
        //.set('Authorization', `Bearer ${token}`)
        .send({
            newName: 'mowaZmianaNazwy2',
        })
        .expect(401);
});

//##############################################################
//##############################################################
//### Wywołanie narzędzi automatycznych            #############
//##############################################################
//##############################################################

//##############################################################
// UWAGA: chwilowo zakomentowane ponieważ było testowane 
// w POSTMANie. Jest jakiś problem z integracją jest z dockerem
//##############################################################

/*
let newCon_celnik_mp3_160kbps_cbr;
let newCon_dlugie_MP3_160kbpm_cbr;
let newCon_kleska_MP3_64kbps_cbr;
let newCon_mowa;
let newCon_opowiesci_MP3_vbr;
let newCon_senator_ogg;
*/

/*
test('Powinien wykonać VAD nad każdym testowm kontenerze dla zalogowanego użytkownika', async () => {
    const res_celnik_mp3_160kbps_cbr = await request(app)
        .put('/repoFiles/runSpeechVAD/'+newCon_celnik_mp3_160kbps_cbr._id)
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(200);

    const res_dlugie_MP3_160kbpm_cbr = await request(app)
        .put('/repoFiles/runSpeechVAD/'+newCon_dlugie_MP3_160kbpm_cbr._id)
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(200);

    const res_kleska_MP3_64kbps_cbr = await request(app)
        .put('/repoFiles/runSpeechVAD/'+newCon_kleska_MP3_64kbps_cbr._id)
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(200);

    const res_mowa = await request(app)
        .put('/repoFiles/runSpeechVAD/'+newCon_mowa._id)
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(200);

    const res_opowiesci_MP3_vbr= await request(app)
        .put('/repoFiles/runSpeechVAD/'+newCon_opowiesci_MP3_vbr._id)
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(200);

    const res_senator_ogg= await request(app)
        .put('/repoFiles/runSpeechVAD/'+newCon_opowiesci_MP3_vbr._id)
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(200);

},720000000);

test('NIE Powinien wykonać VAD na kontenerze dla nie zalogowanego użytkownika', async () => {
    const res_celnik_mp3_160kbps_cbr = await request(app)
        .put('/repoFiles/runSpeechVAD/'+newCon_celnik_mp3_160kbps_cbr._id)
        //.set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(401);

},720000000);


test('Powinien wykonać DIA nad każdym testowm kontenerze dla zalogowanego użytkownika', async () => {
    const res_celnik_mp3_160kbps_cbr = await request(app)
        .put('/repoFiles/runSpeechDiarization/'+newCon_celnik_mp3_160kbps_cbr._id)
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(200);

    const res_dlugie_MP3_160kbpm_cbr = await request(app)
        .put('/repoFiles/runSpeechDiarization/'+newCon_dlugie_MP3_160kbpm_cbr._id)
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(200);

    const res_kleska_MP3_64kbps_cbr = await request(app)
        .put('/repoFiles/runSpeechDiarization/'+newCon_kleska_MP3_64kbps_cbr._id)
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(200);

    const res_mowa = await request(app)
        .put('/repoFiles/runSpeechDiarization/'+newCon_mowa._id)
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(200);

    const res_opowiesci_MP3_vbr= await request(app)
        .put('/repoFiles/runSpeechDiarization/'+newCon_opowiesci_MP3_vbr._id)
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(200);

    const res_senator_ogg= await request(app)
        .put('/repoFiles/runSpeechDiarization/'+newCon_opowiesci_MP3_vbr._id)
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(200);

},720000000);


test('NIE Powinien wykonać DIA na kontenerze dla nie zalogowanego użytkownika', async () => {
    const res_celnik_mp3_160kbps_cbr = await request(app)
        .put('/repoFiles/runSpeechDiarization/'+newCon_celnik_mp3_160kbps_cbr._id)
        //.set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(401);
},720000000);

test('Powinien wykonać REC nad każdym testowm kontenerze dla zalogowanego użytkownika', async () => {
    const res_celnik_mp3_160kbps_cbr = await request(app)
        .put('/repoFiles/runSpeechDiarization/'+newCon_celnik_mp3_160kbps_cbr._id)
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(200);

    const res_dlugie_MP3_160kbpm_cbr = await request(app)
        .put('/repoFiles/runSpeechDiarization/'+newCon_dlugie_MP3_160kbpm_cbr._id)
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(200);

    const res_kleska_MP3_64kbps_cbr = await request(app)
        .put('/repoFiles/runSpeechDiarization/'+newCon_kleska_MP3_64kbps_cbr._id)
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(200);

    const res_mowa = await request(app)
        .put('/repoFiles/runSpeechDiarization/'+newCon_mowa._id)
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(200);

    const res_opowiesci_MP3_vbr= await request(app)
        .put('/repoFiles/runSpeechDiarization/'+newCon_opowiesci_MP3_vbr._id)
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(200);

    const res_senator_ogg= await request(app)
        .put('/repoFiles/runSpeechDiarization/'+newCon_opowiesci_MP3_vbr._id)
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(200);

},720000000);

test('NIE Powinien wykonać REC na kontenerze dla nie zalogowanego użytkownika', async () => {
    const res_celnik_mp3_160kbps_cbr = await request(app)
        .put('/repoFiles/runSpeechDiarization/'+newCon_celnik_mp3_160kbps_cbr._id)
        //.set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(401);

},720000000);

test('Powinien wykonać SEG nad każdym testowm kontenerze dla zalogowanego użytkownika', async () => {
    const res_celnik_mp3_160kbps_cbr = await request(app)
        .put('/repoFiles/runSpeechSegmentation/'+newCon_celnik_mp3_160kbps_cbr._id)
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(200);

    const res_dlugie_MP3_160kbpm_cbr = await request(app)
        .put('/repoFiles/runSpeechSegmentation/'+newCon_dlugie_MP3_160kbpm_cbr._id)
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(200);

    const res_kleska_MP3_64kbps_cbr = await request(app)
        .put('/repoFiles/runSpeechSegmentation/'+newCon_kleska_MP3_64kbps_cbr._id)
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(200);

    const res_mowa = await request(app)
        .put('/repoFiles/runSpeechSegmentation/'+newCon_mowa._id)
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(200);

    const res_opowiesci_MP3_vbr= await request(app)
        .put('/repoFiles/runSpeechSegmentation/'+newCon_opowiesci_MP3_vbr._id)
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(200);

    const res_senator_ogg= await request(app)
        .put('/repoFiles/runSpeechSegmentation/'+newCon_opowiesci_MP3_vbr._id)
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(200);
},720000000);


test('NIE Powinien wykonać SEG nad każdym testowm kontenerze dla nie zalogowanego użytkownika', async () => {
    const res_celnik_mp3_160kbps_cbr = await request(app)
        .put('/repoFiles/runSpeechSegmentation/'+newCon_celnik_mp3_160kbps_cbr._id)
        //.set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(401);

},720000000);

*/


//###############################################################################################
//############################### Pozostałe rzeczy dotyczące plików #############################
//###############################################################################################


test('Powinine wygenerować korpus dla zalogowanego użytkownika i móc go ściągnąć', async () => {
    const result = await request(app)
        .get('/repoFiles/createCorpus/' + newProject._id)
        .set('Authorization', `Bearer ${token}`)
        //.send()
        .expect(200);

    const result2 = await request(app)
        .get('/repoFiles/downloadCorpus/' + newProject._id)
        .set('Authorization', `Bearer ${token}`)
        //.send()
        .expect(200);
});

test('NIE Powininen wygenerować korpusu dla nie zalogowanego użytkownika', async () => {
    const result = await request(app)
        .get('/repoFiles/createCorpus/' + newProject._id)
        //.set('Authorization', `Bearer ${token}`)
        //.send()
        .expect(401);

    const result2 = await request(app)
        .get('/repoFiles/downloadCorpus/' + newProject._id)
        //.set('Authorization', `Bearer ${token}`)
        //.send()
        .expect(401);
});

test('Powinine zwrócić zawartość projektu dla zalogowanego użytkownika', async () => {
    const result = await request(app)
        .get('/repoFiles/getProjectAssets/' + newProject._id)
        .set('Authorization', `Bearer ${token}`)
        //.send()
        .expect(200);
});

test('NIE powinine zwrócić zawartość projektu dla nie zalogowanego użytkownika', async () => {
    const result = await request(app)
        .get('/repoFiles/getProjectAssets/' + newProject._id)
        //.set('Authorization', `Bearer ${token}`)
        //.send()
        .expect(401);
});

