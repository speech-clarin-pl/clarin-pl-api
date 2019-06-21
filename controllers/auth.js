const User = require('../models/user');
const {validationResult} = require('express-validator/check');
const bcrypt = require('bcryptjs');

exports.registration = (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    const email = req.body.email;
    const name = req.body.name;
    const password = req.body.password;

    

    //haszuje haslo
    bcrypt.hash(password,24)
    .then(hashedPass => {
        const user = new User({
            email: email,
            password: hashedPass,
            name: name
        });

        return user.save();
    })
    .then(result => {
        res.status(201).json({message: 'User created', userId: result._id})
    })
    .catch(error => {
        if(!error.statusCode){
            error.statusCode = 500;
        }
        next(error);
    });



}