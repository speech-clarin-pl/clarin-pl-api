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




test('Powinien zarejestrować nowego użytkownika', async () =>{
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
    expect(defaultSession).not.toBeNull();
    
})



test('Powinien zalogować istniejącego użytkownika', async () => {
    const response = await request(app).post('/auth/login').send({
        email: userOne.email,
        password: 'haslo123'
    }).expect(200)

    //sprawdzam czy zwraca poprawny token
    //expect(response.body.token).toBe(token);
})


test('Powinien utworzyć nowy projekt dla zalogowanego użytkownika', async () => {
    const response = await request(app)
        .post('/projectsList/addProject')
        .set('Authorization', `Bearer ${token}`)
        .send({
            projectName: 'testProject'
        })
        .expect(201);
});

test('Powinien NIE pozwolić stworzyć nowego projektu dla NIE zalogowanego użytkownika', async () => {
    const response = await request(app)
        .post('/projectsList/addProject')
        //.set('Authorization', `Bearer ${token}`)
        .send({
            projectName: 'testProject2'
        })
        .expect(401);
});

test('Poninen wgrać krótki plik audio WAV do repozytoriu gdy użytkownik jest zalogowany', async () => {
    const response = await request(app)
        .post('/repoFiles/uploadFile')
        .set('Authorization', `Bearer ${token}`)
        .field('projectId',defaultProject._id+"")
        .field('sessionId',defaultSession._id+"")
        .attach('myFile','tests/fixtures/mowa.wav')
        .expect(200)
});

/*

test('Powinine zwrócić zawartość domyślnego projektu zalogowanego użytkownika', async () => {
    await request(app)
        .get('/repoFiles/:projectId')
        .set('Authorization', `Bearer ${token}`)
        .send()
        .expect(200);
});


test('Powinine NIE pozwolić zobaczyć zawartości projektu dla niezalogowanych użytkowników', async () => {
    await request(app)
        .get('/repoFiles/:projectId')
        .send()
        .expect(401);
});
*/