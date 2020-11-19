const express = require('express');
const { body } = require('express-validator/check'); // for validation
const router = express.Router();

const User = require('../models/user');
const authController = require('../controllers/auth');

//################ rejestracja ##############


router.put('/registration',[
    body('email').isEmail().withMessage('Please write a valid email')
        .custom((value, {req}) => {
            //sprawdzam czy juz istnieje w bazie
            return User.findOne({email: value}).then(userDoc => {
                if(userDoc){
                    return Promise.reject('Email address already exists!');
                }
            })
        }),
    body('password').trim().isLength({min: 6}),
    body('name').trim().not().isEmpty()
], authController.registration);


//############## wyświetlenie strony do wpisania nowego hasła ############

//router.get('/enterNewPass/:token',authController.enterNewPass);

//############## przypomnienie hasła - wysłanie linka na email ############
router.post('/forgotPass/:emailAddress',authController.forgotPass);

//############## przypomnienie hasła - wpisanie nowego hasła przez uzytkownika ############
router.post('/enterNewPass/:userId/:token',authController.applyNewPass);

//############## logowanie ############

router.post('/login',authController.login);

module.exports = router;