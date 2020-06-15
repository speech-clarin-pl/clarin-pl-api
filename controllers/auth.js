const User = require('../models/user');
const {validationResult} = require('express-validator/check');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const transporter = require('../transporter');
var generator = require('generate-password');

dotenv.config();

var mkdirp = require("mkdirp"); //do tworzenia folderu
//var rimraf = require("rimraf"); 
var appRoot = require('app-root-path'); //zwraca roota aplikacji



sendEmail = (sendTo, title, htmlContent) => {
    return new Promise((resolve,reject) => {

        let orderEmailOptions = {
            from: "Fred Foo <foo@example.com>",
            to: sendTo,
            subject: title,
            html: htmlContent,
        };

        transporter.sendMail(orderEmailOptions, (err, inf) => {
            if(err){
                console.log('Error in sending email', err);
                return reject({ msg: 'Internal Server Error', error: err});
            } else {
                console.log("Message sent: %s", inf.messageId);
                console.log("Preview URL: %s", nodemailer.getTestMessageUrl(inf));
                return resolve({ msg: 'Email has been send successfully' });
            }
        })
    });
  }


sendEmailToResetPass = (emailAddr, user) => {


    User.findByIdAndUpdate(user._id,{password: newpassword })
    .then(updatedUser => {
        sendEmail('mklec@pjwstk.edu.pl','CLARIN-PL: reset hasła', '<b>Testowa wiadomość</b>')
        .then(message => {
            console.log('Email wysłany with success!!')
        })
        .catch(console.error);
    })
    .catch(err => {

    })
}



exports.applyNewPass = (req,res,next) => {

    const {userId} = req.params;
    const {token} = req.params;
    const newPassword = req.body.newPassword;


     User.findOne({_id: userId})
     .then(user => {
         //jezeli nie ma takiego uzera 
         if(!user){
            res.status(204).json({message: "This email has not been registered before!"});
         } else {

            const secret = user.password + "-" + user.createdAt;
            const payload = jwt.decode(token,secret);

            if(payload.userId == user._id){
                bcrypt.hash(newPassword,12)
                .then(hashedPass => {
                    User.findOneAndUpdate({_id: userId}, {password: hashedPass})
                        .then(()=>{
                            console.log("HASLO ZMIENIONE")
                            res.status(202).json("Password changed")
                        })
                        .catch(err=>{
                            console.log("PROBLEM ZE ZMIANA HASLA")
                            res.status(500).json(err)
                        })
                })
            }
         }
     })
     .catch(error => {
        if(!error.statusCode){
            error.statusCode = 500;
        }
        console.log(error)
        next(error);
     })
     
}


exports.forgotPass = (req,res,next) => {
    const {emailAddress} = req.params;

    //znajduje login ktory zawiera dany email
     User.findOne({email: emailAddress})
     .then(user => {
         //jezeli nie ma takiego uzera 
         if(!user){
            res.status(204).json({message: "This email has not been registered before!"});
         } else {

            const oldPassHash = user.password;
            const userId = user._id;
            const createdAt = user.createdAt;

            //tworze jednorazowy link...
            const secret = oldPassHash + "-" + createdAt;

            // generuje tokena JWT dla tego emaila
            const token = jwt.sign({
                email: emailAddress, 
                userId: user._id.toString()
            }, secret,
            {expiresIn: '1h'});


             // generuje link zawierający wygenerowany token
            const url = process.env.FRONT_END_ADDRESS + "/enterNewPass/"+userId+'/'+token;

            let messageemail = `<b>Aby zresetować hasło kliknij w link poniżej</b>`;
            messageemail = messageemail + `<p></b>Link do zresetowania hasła: </b></p>`;
            messageemail = messageemail + `<p><a href=${url} target="_blank">${url}</a></p>`;


            //wysyłka emaila z resetem hasła
            sendEmail(emailAddress,'CLARIN-PL: Potwierdź zmianę hasła', messageemail)
                .then(message => {
                    res.status(200).json({message: "The email with further instructions has been sent"});
                })
                .catch(err => {
                    console.log(err);
                    res.status(500).json({message: "Something went wrong"});   
                });
         }
     })
     .catch(error => {
        if(!error.statusCode){
            error.statusCode = 500;
        }
        console.log(error)
        next(error);
     })
}

// rejestracja
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

        //console.log(user)

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

// logowanie
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
                const error = new Error('Wrong password or login');
                error.statusCode = 401;
                throw error
            }

            //tutaj uzytkonik wpisal dore haslo i musimy wygenerowac token dla klienta
            const token = jwt.sign({
                email: loadedUser.email, 
                userId: loadedUser._id.toString()
            }, config.tokenKey,
            {expiresIn: '96h'});

            res.status(200).json({token: token, userId: loadedUser._id.toString(), userName:loadedUser.name });
        })
        .catch(error => {
            if(!error.statusCode){
                error.statusCode = 500;
            }
            next(error);
        });
}

