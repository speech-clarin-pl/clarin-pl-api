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
    email: 'mklec@pjwstk.edu.pl',
    password: '$2a$12$/64RBxapSdxAttdygONyxur7tWOan5UWS46Wz/N9BFCwRgx6s7Lba',
    status: 'Active',
}

const token = jwt.sign({
    email: userOne.email, 
    userId: userOne._id.toString()
}, config.tokenKey);
//{expiresIn: '192h'});

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
