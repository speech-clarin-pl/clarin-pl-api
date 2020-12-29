const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../../models/user');
const config = require('../../config');

//potrzebuje do wygenerowania tokenu do testów
const userOneId = new mongoose.Types.ObjectId();

//Domyślny użytkownik
const userOne = {
    _id: userOneId,
    name: 'Mario',
    email: 'kontakt@domain.com',
    password: '$2a$12$ERIipjT2XZZmV28z.ahdMO9Dw2WwNH/JeuWsa44fwVQTZ3b6ttdbK',
}

const token = jwt.sign({
    email: userOne.email, 
    userId: userOne._id.toString()
}, config.tokenKey,
{expiresIn: '192h'});

const setupDatabase = async() => {
    await User.deleteMany();
    await new User(userOne).save();
}

module.exports = {
    userOneId,
    userOne,
    setupDatabase,
    token
}
