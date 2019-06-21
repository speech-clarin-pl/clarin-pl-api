const User = require('../models/user');
const {validationResult} = require('express-validator/check');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

    //console.log(email)
    //console.log(name)
    //console.log(password)

    //haszuje haslo
    bcrypt.hash(password,12)
    .then(hashedPass => {

        const user = new User({
            email: email,
            password: hashedPass,
            name: name
        });

        //console.log(user)

        return user.save();
    })
    .then(result => {

        console.log(result)
        res.status(201).json({message: 'User created', userId: result._id})
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
            }, 'olaujelajajo',
            {expiresIn: '10h'});

            res.status(200).json({token: token, userId: loadedUser._id.toString(), userName:loadedUser.name });
        })
        .catch(error => {
            if(!error.statusCode){
                error.statusCode = 500;
            }
            next(error);
        });
}