const request = require('supertest');
const app = require('../appPre');
const {
    userOneId, 
    userOne, 
    setupDatabase, 
    token,
} = require('./fixtures/db');
//przed każdym testem...
beforeEach(setupDatabase)

test('test2', () => {
    
})