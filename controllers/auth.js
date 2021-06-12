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
const createProjectHandler = require('./Handlers/createProjectHandler');

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
 * @api {post} /auth/forgotPass/ Odzyskanie hasła
 * @apiDescription Pozwala użytkownikowi wygenerować nowe hasło. Wywołanie tego API powoduje wysłąnie wiadomości email na adres użytkownika z linkiem do strony gdzie można wprowadzić nowe hasło.
 * @apiName ForgotPassword
 * @apiGroup Użytkownik
 *
 * @apiParam {String} email Email
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
    const emailAddress = req.body.email;

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


// wysyła maila do administratora
exports.sendEmailToAdmin = (req,res,next) => {

    console.log(chalk.greenBright("Wysyłam maila do administratora..."))

    const email = req.body.email;
    const message = req.body.message;
    const loggedEmail = req.body.loggedEmail;

    const towhom = "mklec@pjwstk.edu.pl"; // TODO: zamienić na zmienną środowiskową
    const title = "CLARIN-PL: Zgłoszenie do admina";
    const htmlContent = `<h2>Zgłoszenie ze strony CLARIN-PL</h2>
    <p>Wiadomość pochodząca z konta zarejestrowanego na: ${loggedEmail}</p>
    <p>Użytkownik prosi aby odpowiedzieć na: ${email}</p>
    <p><b>Wiadomość</b></p>
    <p>${message}</p>`;

    sendEmail(towhom,title, htmlContent)
                .then(message => {
                    res.status(200).json({message: "Wiadomość została wysłana pomyślnie."});
                })
                .catch(error => {
                    error.statusCode = 502;
                    error.message = 'Coś poszło nie tak z wysłaniem maila';
                    throw error;
                });
}



/**
 * @api {put} /auth/registration Rejestracja użytkownika
 * @apiDescription Rejestracja nowego użytkownika. Tylko zarejestrowani użytkownicy mogą wykonywać zapytania do API. W ten sposób chronimy dostęp do Twoich danych. Podczas rejestracji tworzony jest domyślny projekt z dwoma sesjami. Sesja demo z przykładowymi plikami oraz sesja domyślna, gotowa do wgrania własnych plików. Użytkownik może je zostawić, skasować bądź utworzyć własne dodatkowe sesje.
 * @apiName RegisterUser
 * @apiGroup Użytkownik
 *
 * @apiParam {String} email Email 
 * @apiParam {String} name Imię
 * @apiParam {String} password Hasło
 *
 * @apiSuccess {String} message wiadomość potwierdzająca
 * @apiSuccess {String} defaultProjectId Identyfikator pierwszego stworzonego projektu do którego domyślnie będą wgrywane pliki oraz rezultaty działania narzędzi (o ile nie zostanie utworzony osobny projekt).
* @apiSuccess {String} defaultSessionId Identyfikator pierwszej pustej sesji, gotowej do wgrania do niej własnych plików
* @apiSuccess {String} demoSessionId Identyfikator sesji demo z wgranymi przykładowymi plikami
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 201 CREATED
 *     {
 *       "message": 'Użytkownik został stworzony',
 *       "defaultProjectId": "5f58a92dfa006c8aed96f846",
 *       "defaultSessionId": "5fd33950667fa7255da2dfa9"
 *     }
 *
 * @apiError (422) UnprocesssableEntity Błędy walidacji
 * @apiError (500) ServerError Serwer error
 * 
 */
exports.registration = (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){

        //zbieram informacje o błędzie
        let message = '';
        errors.array().forEach(element => {
            message = message + element.msg + "\n";
        })
        
        const error = new Error(message);
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }

    const email = req.body.email+'';
    const name = req.body.name+'';
    const password = req.body.password+'';

    //generuje token do potwierdzenia
    const token = jwt.sign({
        email: email, 
        name: name,
    }, config.tokenKey);

    const user = new User({
        email: email,
        password: bcrypt.hashSync(password,12),
        name: name,
        confirmationCode: token,
    });

    user.save().then(user => {

        // generuje link zawierający wygenerowany token
        const linkurl = process.env.FRONT_END_ADDRESS + "/confirmRegistration/"+token;

        const messageemail = `<h2>Rejestracja konta w serwisie CLARIN-PL</h2>
                            <h3>Witaj ${name}</h3>
                            <p>Potwierdź rejestrację klikając w poniższy link:</p>
                            <a href="${linkurl}">${linkurl}</a>`

        sendEmail(email,'CLARIN-PL: Rejestracja konta', messageemail)
        .then(message => {
            res.status(200).json({message: "Wiadomość z linkiem aktywacyjnym została wysłana na podany adres email"});
        })
        .catch(error => {
            error.statusCode = 502;
            error.message = 'Coś poszło nie tak z wysłaniem maila';
            throw error;
        });
    })   
}

// weryfikacja użytkownika po kliknięciu linku wysłanego na maila
exports.verifyUser = (req, res, next) => {

    User.findOne({
            confirmationCode: req.params.confirmationCode,
        }).then(user => {

            if (!user) {
                const error = new Error('Użytkownik nie został znaleziony');
                error.statusCode = 404;
                throw error;
            }

            user.status = "Active";

            user.save().then(user => {

                //tutaj tworzenie folderu z id uzytkownika w repo
                const dirpath = appRoot + '/repo/' + user._id;
                mkdirp(dirpath, function (err) {
                    // if any errors then print the errors to our console
                    if (err) {
                        console.log(chalk.red(err));
                        return err;
                    } else {
                        createProjectHandler("DOMYŚLNY PROJEKT", user._id, true).then((results) => {
                            res.status(201).json({
                                message: 'Konto zostało założone',
                                defaultProjectId: results.project._id,
                                defaultSessionId: results.defaultSession._id,
                                demoSessionId: results.demoSession._id
                            });
                        }).catch((err) => {
                            return err;
                        })
                    }
                });

            }).catch((error) => {
                console.log(chalk.red(error.message));
                error.statusCode = error.statusCode || 500;
                next(error);
            });


        })
        .catch((error) => {
            console.log(chalk.red(error.message));
            error.statusCode = error.statusCode || 500;
            next(error);
        });
}



//pod spodem kopia działającej rejestracji bez wysyłania maila
/*
exports.registration = (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){

        //zbieram informacje o błędzie
        let message = '';
        errors.array().forEach(element => {
            message = message + element.msg + "\n";
        })
        
        const error = new Error(message);
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
                projectsList.createProjectHandler("DOMYŚLNY PROJEKT",user._id, true).then((results)=>{  
                    res.status(201).json({message: 'Użytkownik został stworzony', defaultProjectId: results.project._id, defaultSessionId: results.defaultSession._id,  demoSessionId: results.demoSession._id });
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
*/



/**
 * @api {post} /auth/login Logowanie
 * @apiDescription Pozwala na zalogowanie się zarejestrowanym użytkownikom i uzyskanie tokenu JWT do przeprowadzania dzalszych zapytań API. Token należy podawać w nagłówku zapytań w polu 'Authorization'. Token jest ważny przez 192h (8 dni). Po tym czasie należy zalogować się ponownie.
 * @apiName LoginUser
 * @apiGroup Użytkownik
 *
 * @apiParam {String} email Email użytkownika
 * @apiParam {String} password Hasło użytkownika
 *
 * @apiSuccess {String} message Potwierdzenie logowania
 * @apiSuccess {String} token Token który należy podać w nagłówku zapytania do API w polu "Authorization" jako 'Bearer token' gdzie zamiast słowa token podajemy rzeczywisty token uzyskany po zalogowaniu.
 * @apiSuccess {String} userName Nazwa użytkownika
 * @apiSuccess {String} email Email użytkownika
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "message" : 'Jesteś zalogowany',
 *       "token": eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im1rbGVjQHBqd3N0ay5lZHUucGwiLCJ1c2VySWQiOiI1ZjU4YTkyZGZhMDA2YzhhZWQ5NmY4NDYiLCJpYXQiOjE2MDYzMDc1NzEsImV9cXI6MPYwNjY1MzEeMX0.-ABd2a0F3lcuI0yDV7eymq4ey5_J__xGdyYAk56icO4,
 *       "userName": Kowalski,
 *       "email": "kowalski@gmail.com"
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

            //jezeli nie ma statusu "Active" - czyli że nie potwierdził w mailu
            if(user.status != "Active"){
                const error = new Error('Konto niepotwierdzone. Sprawdź swój email i potwierdź założenie konta klikając w wysłany link.');
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

            res.status(200).json({message: 'Jesteś zalogowany poprawnie.', token: token, userName:loadedUser.name, email: loadedUser.email});

        })
        .catch((err) => {
            console.log(chalk.red(err.message));
            err.statusCode = err.statusCode || 500;
            next(err);
        });
}

