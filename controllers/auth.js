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
const projectsList = require('../controllers/projectsList');

dotenv.config();

var mkdirp = require("mkdirp"); //do tworzenia folderu
//var rimraf = require("rimraf"); 
var appRoot = require('app-root-path'); //zwraca roota aplikacji
const chalk = require('chalk');



sendEmail = (sendTo, title, htmlContent) => {
    return new Promise((resolve,reject) => {

        let orderEmailOptions = {
            from: "CLARIN-PL <speechtools@clarin-pl.eu>",
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

/**
 * @api {post} /auth/forgotPass/:emailAddress Password recovery
 * @apiDescription Allows the user to generate new password for his account. This only sends email to the user with the link which the user has to click to access the page where he will be able to enter new password
 * @apiName ForgotPassword
 * @apiGroup User
 *
 * @apiParam {String} email User email
 *
 * @apiSuccess {String} message that the user has been created
 * @apiSuccess {String} userId  the user id created
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "message": "The email with further instructions has been sent",
 *     }
 *
 * @apiError (401) Unathorized The email has not been registered
 * @apiError (500) ServerError Something went wrong in the server.
 * 
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *       "message": "Something went wrong with sending the email"
 *     }
 * 
 */
exports.forgotPass = (req,res,next) => {
    const {emailAddress} = req.params;

    //znajduje login ktory zawiera dany email
     User.findOne({email: emailAddress})
     .then(user => {
         //jezeli nie ma takiego usera 
         if(!user){
            res.status(401).json({message: "This email has not been registered before!"});
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

            let messageemail = `<b>Aby zresetować hasło kliknij w link poniżej (działa tylko przez 1 godzinę)</b>`;
            messageemail = messageemail + `<p></b>Link do zresetowania hasła: </b></p>`;
            messageemail = messageemail + `<p><a href=${url} target="_blank">${url}</a></p>`;


            //wysyłka emaila z resetem hasła
            sendEmail(emailAddress,'CLARIN-PL: Potwierdź zmianę hasła', messageemail)
                .then(message => {
                    res.status(200).json({message: "The email with further instructions has been sent"});
                })
                .catch(err => {
                    console.log(err);
                    res.status(500).json({message: "Something went wrong with sending the email"});   
                });
         }
     })
     .catch(() => {
        console.log(chalk.red("Something went wrong with FORGOT PASSWORD"))

        const error = new Error("Something went wrong with FORGOT PASSWORD");
        error.statusCode = 500;
        error.data = [];

        next(error);;
     })
}


/**
 * @api {put} /auth/registration Register new User
 * @apiDescription Allows to register new user. Its necessary to run speech services using user interface and to process files in batch.
 * @apiName RegisterUser
 * @apiGroup User
 *
 * @apiParam {String} email User email
 * @apiParam {String} name User name
 * @apiParam {String} password User password (min. 6 characters)
 *
 * @apiSuccess {String} message that the user has been created
 * @apiSuccess {String} userId  the user id created
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 201 CREATED
 *     {
 *       "message": 'The user has been created',
 *       "userId": "5f58a92dfa006c8aed96f846"
 *     }
 *
 * @apiError (422) ValidationFailed When profided wrong data.
 * @apiError (500) ServerError When can not save the user to database.
 * 
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *       "message": ""Something went wrong with saving the user to database",
 *       "data": undefined
 *     }
 * 
 */
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

        //tutaj tworzenie folderu z id uzytkownika w repo
        const dirpath = appRoot + '/repo/'+user._id;


        //--------------------------
      
        mkdirp(dirpath, function(err) {
            // if any errors then print the errors to our console
            if (err) {
                console.log(chalk.red(err));
                return err;
            } else {
                //tworze katalog z plikami tymczasowymi, wgrywanymi bez GUI

                projectsList.createProjectHandler("Your First Demo Project",user._id).then((results)=>{
                    //console.log(chalk.green("Successfully created user directory"));          
                    res.status(201).json({message: 'The user has been created', userId: user._id});
                }).catch((err)=>{
                    return err;
                })

                /*
                mkdirp(dirpath+'/temporary', function(err) {
                    if (err) {
                        console.log(chalk.red(err));
                        return err;
                    } else {
                        // else print a success message.
                        console.log(chalk.green("Successfully created user directory"));
                                        
                        res.status(201).json({message: 'The user has been created', userId: user._id});
                    }
                })
                */
              
            }
          });
          
    })
    .catch(() => {

        console.log(chalk.red("Something went wrong with creating the user"))
        const error = new Error("Something went wrong with creating the user");
        error.statusCode = 500;
        error.data = [];

        next(error);
    });
}

/**
 * @api {post} /auth/login Log in
 * @apiDescription Allows to log in of registered user and get the token
 * @apiName LoginUser
 * @apiGroup User
 *
 * @apiParam {String} email User email
 * @apiParam {String} password User password 
 *
 * @apiSuccess {String} message that the user has been created
 * @apiSuccess {String} userId  the user id created
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "token": eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im1rbGVjQHBqd3N0ay5lZHUucGwiLCJ1c2VySWQiOiI1ZjU4YTkyZGZhMDA2YzhhZWQ5NmY4NDYiLCJpYXQiOjE2MDYzMDc1NzEsImV9cXI6MPYwNjY1MzEeMX0.-ABd2a0F3lcuI0yDV7eymq4ey5_J__xGdyYAk56icO4,
 *       "userId": "5f58a92dfa006c8aed96f846"
 *     }
 *
 * @apiError (401) Unathorized can not find given email or is wrong password
 * @apiError (500) ServerError internal server error
 * 
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *       "message": "Something went wrong with loggin in the user",
 *       "data": undefined
 *     }
 * 
 */
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
        .catch(() => {

            console.log(chalk.red("Something went wrong with loggin in the user"))

            const error = new Error("Something went wrong with loggin in the user");
            error.statusCode = 500;
            error.data = [];
    
            next(error);

           
        });
}
