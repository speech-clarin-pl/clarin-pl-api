const User = require('../models/user');
const Project = require('../models/projectEntry')
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
                return resolve({ msg: 'Email został wysłany pomyślnie' });
            }
        })
    });
  }





exports.applyNewPass = (req,res,next) => {

    const {userId} = req.params;
    const {token} = req.params;
    const newPassword = req.body.newPassword;

     User.findOne({_id: userId})
     .then(user => {
         //jezeli nie ma takiego usera 
         if(!user){
            res.status(204).json({message: "Ten email nie został zarejestrowany wcześniej"});
         } else {

            const secret = user.password + "-" + user.createdAt;
            const payload = jwt.decode(token,secret);

            if(payload.userId == user._id){
                bcrypt.hash(newPassword,12)
                .then(hashedPass => {
                    User.findOneAndUpdate({_id: userId}, {password: hashedPass})
                        .then(()=>{
                            console.log(chalk.green("HASLO ZMIENIONE"))
                            res.status(202).json("Hasło zmienione")
                        })
                        .catch(err=>{
                            console.log(chalk.red("PROBLEM ZE ZMIANA HASLA"))
                            throw err;
                        })
                })
            }
         }
     })
     .catch(error => {
        if(!error.statusCode){
            error.statusCode = 500;
        }
        console.log(chalk.red(error.message));
        next(error);
     })
     
}

/**
 * @api {post} /auth/forgotPass/:emailAddress Odzyskanie hasła
 * @apiDescription Pozwala użytkownikowi wygenerować nowe hasło. Wywołanie tego api powoduje wysłąnie wiadomości email na adres użytkownika z linkiem do strony gdzie użytkownik może wprowadzić nowe hasło.
 * @apiName ForgotPassword
 * @apiGroup Użytkownik
 *
 * @apiParam {String} email Email
 *
 * @apiSuccess {String} message Wiadomość potwierdzająca wysłanie maila
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "message": "Wiadomość z dalszymi instrukcjami została wysłana na podany adres email",
 *     }
 *
 * @apiError (401) Unathorized Nie znaleziono danego adres email
 * @apiError (500) ServerError Serwer error
 * @apiError (502) BadGateway Problem z wysłaniem maila
 * 
 */
exports.forgotPass = (req,res,next) => {
    const {emailAddress} = req.params;

    //znajduje login ktory zawiera dany email
     User.findOne({email: emailAddress})
     .then(user => {
         //jezeli nie ma takiego usera 
         if(!user){
            res.status(401).json({message: "Ten email nie został wcześniej zarejestrowany!"});
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
                    res.status(200).json({message: "Wiadomość z dalszymi instrukcjami została wysłana na podany adres email"});
                })
                .catch(error => {
                    error.statusCode = 502;
                    error.message = 'Coś poszło nie tak z wysłaniem maila';
                    throw error;
                });
         }
     })
     .catch((error) => {
        console.log(chalk.red(error.message));
        error.statusCode = error.statusCode || 500;
        next(error);
     })
}


/**
 * @api {put} /auth/registration Rejestracja użytkownika
 * @apiDescription Rejestracja nowego użytkownika. Po zalogowaniu uzyskasz token na potrzeby uruchamiania narzędzi mowy z uwzględnieniem bezpieczeństwa Twoich danych. 
 * @apiName RegisterUser
 * @apiGroup Użytkownik
 *
 * @apiParam {String} email Email 
 * @apiParam {String} name Imię
 * @apiParam {String} password Hasło
 *
 * @apiSuccess {String} message wiadomość potwierdzająca
 * @apiSuccess {String} userId  Identyfikator użytkownika
 * @apiSuccess {String} firstProjectId Identyfikator pierwszego stworzonego projektu do którego domyślnie będą wgrywane pliki oraz rezultaty działania narzędzi (o ile nie stworzysz osobnego projektu).
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 201 CREATED
 *     {
 *       "message": 'Użytkownik został stworzony',
 *       "userId": "5f58a92dfa006c8aed96f846",
 *       "firstProjectId": "5fd33950667fa7255da2dfa9"
 *     }
 *
 * @apiError (422) UnprocesssableEntity Błędy walidacji
 * @apiError (500) ServerError Serwer error
 * 
 */
exports.registration = (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const error = new Error('Błąd walidacji');
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
                projectsList.createProjectHandler("DEMO",user._id).then((results)=>{        
                    res.status(201).json({message: 'Użytkownik został stworzony', userId: user._id});
                }).catch((err)=>{
                    return err;
                })
            }
          });
          
    })
    .catch((error) => {
        console.log(chalk.red(error.message));
        error.statusCode = error.statusCode || 500;
        next(error);
    });
}

/**
 * @api {post} /auth/login Logowanie
 * @apiDescription Pozwala na zalogowanie się już zarejestrowanym użytkownikom i uzyskanie tokenu JWT do przeprowadzania dzalszych zapytań
 * @apiName LoginUser
 * @apiGroup Użytkownik
 *
 * @apiParam {String} email Email użytkownika
 * @apiParam {String} password Hasło użytkownika
 *
 * @apiSuccess {String} token Token który należy podać w nagłówku zapytania do API w polu "Authorization" jako 'Bearer <token>'. Token jest ważny przez 192h (8 dni). Po tym czasie należy zalogować się ponownie.
 * @apiSuccess {String} userId Identyfikator użytkownika
 * @apiSuccess {String} userName Nazwa użytkownika
 * @apiSuccess {String} firstProjectId Identyfikator pierwszego stworzonego projektu do którego domyślnie będą wgrywane pliki oraz rezultaty działania narzędzi (o ile nie stworzysz osobnego projektu)
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "token": eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im1rbGVjQHBqd3N0ay5lZHUucGwiLCJ1c2VySWQiOiI1ZjU4YTkyZGZhMDA2YzhhZWQ5NmY4NDYiLCJpYXQiOjE2MDYzMDc1NzEsImV9cXI6MPYwNjY1MzEeMX0.-ABd2a0F3lcuI0yDV7eymq4ey5_J__xGdyYAk56icO4,
 *       "userId": "5f58a92dfa006c8aed96f846",
 *       "userName": Kowalski,
 *       "firstProjectId": "5fd33950667fa7255da2dfa9"
 *     }
 *
 * @apiError (401) Unathorized Błędne hasło
 * @apiError (404) Not Found Użytkownik o podanym email nie został znaleziony
 * @apiError (500) ServerError Serwer error
 * 
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
                const error = new Error('Użytkownik o tym adresie email nie został znaleziony');
                error.statusCode = 404;
                throw error;
            }

            loadedUser = user;

            //porownuje haslo
            return bcrypt.compare(password, user.password);
        })
        .then(isEqual => {
            //wtedy uzytkownik wpisal zle haslo
            if(!isEqual){
                const error = new Error('Błędne hasło');
                error.statusCode = 401;
                throw error
            }

            //tutaj uzytkonik wpisal dore haslo i musimy wygenerowac token dla klienta
            const token = jwt.sign({
                email: loadedUser.email, 
                userId: loadedUser._id.toString()
            }, config.tokenKey,
            {expiresIn: '192h'});

          
            Project.findOne({owner: loadedUser._id, name: 'DEMO'}).then(firstProject => {
                let fpid = undefined;
                if(firstProject){
                    fpid = firstProject._id
                }
                res.status(200).json({token: token, userId: loadedUser._id.toString(), userName:loadedUser.name, firstProjectId: fpid});
            });
            
        })
        .catch((err) => {
            console.log(chalk.red(err.message));
            err.statusCode = err.statusCode || 500;
            next(err);
        });
}



/*
sendEmailToResetPass = (emailAddr, user) => {

    User.findByIdAndUpdate(user._id,{password: newpassword })
    .then(updatedUser => {
        sendEmail('mklec@pjwstk.edu.pl','CLARIN-PL: reset hasła', '<b>Testowa wiadomość</b>')
        .then(message => {
            console.log(chalk.green('Email wysłany!'))
        })
        .catch(console.error);
    })
    .catch(err => {

    })
}
*/