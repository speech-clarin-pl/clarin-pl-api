const User = require('../models/user');
const {validationResult} = require('express-validator/check');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const dotenv = require('dotenv');
dotenv.config();

var mkdirp = require("mkdirp"); //do tworzenia folderu
//var rimraf = require("rimraf"); 
var appRoot = require('app-root-path'); //zwraca roota aplikacji



exports.registration = (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    const email = req.body.email+'';
    const name = req.body.name+'';
    const password = req.body.password+'';

    bcrypt.hash(password,12)
    .then(hashedPass => {

        const user = new User({
            email: email,
            password: hashedPass,
            name: name
        });

        return user.save();
    })
    .then(user => {

        console.log(user)

        //tutaj tworzenie folderu z id uzytkownika w repo
        const dirpath = appRoot + '/repo/'+user._id;
        mkdirp(dirpath, function(err) {
            // if any errors then print the errors to our console
            if (err) {
                console.log(err);
                return err;
            } else {
                // else print a success message.
                console.log("Successfully created user directory");
                res.status(201).json({message: 'User created', userId: user._id})
            }
          });

         
    })
    .catch(error => {
        console.log(error)
        if(!error.statusCode){
            error.statusCode = 500;
        }
        next(error);
    });

}


exports.login = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;

    let loadedUser;

    //sprawdzam czy istnieje taki email
    User.findOne({email: email})
        .then(user => {
            //jezeli nie ma takiego uzera 
            if(!user){
                const error = new Error('A user with this email could not be found.');
                error.statusCode = 401;
                throw error;
            }

            loadedUser = user;

            //porownuje haslo
            return bcrypt.compare(password, user.password);
        })
        .then(isEqual => {
            //wtedy uzytkownik wpisal zle haslo
            if(!isEqual){
                const error = new Error('Wrong password');
                error.statusCode = 401;
                throw error;
            }

            //tutaj uzytkonik wpisal dore haslo i musimy wygenerowac token dla klienta
            const token = jwt.sign({
                email: loadedUser.email, 
                userId: loadedUser._id.toString()
            }, config.tokenKey,
            {expiresIn: '30h'});

            res.status(200).json({token: token, userId: loadedUser._id.toString(), userName:loadedUser.name });
        })
        .catch(error => {
            if(!error.statusCode){
                error.statusCode = 500;
            }
            next(error);
        });
}