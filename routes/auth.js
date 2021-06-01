const express = require('express');
const { body } = require('express-validator/check'); // for validation
const router = express.Router();
const isAuth = require('../middleware/is-auth');
const User = require('../models/user');
const authController = require('../controllers/auth');

//################ rejestracja ##############


router.put('/registration',[
    body('email').isEmail().withMessage('Wpisz poprawny adres email')
        .custom((value, {req}) => {
            //sprawdzam czy juz istnieje w bazie
            return User.findOne({email: value}).then(userDoc => {
                if(userDoc){
                    return Promise.reject('Ten email już istnieje!');
                }
            })
        }),
    body('password').trim().isLength({min: 7}),
    body('name').trim().not().isEmpty()
], authController.registration);

//################### weryfikacja po kliknięciu w link w mailu ################

router.get('/confirmUser/:confirmationCode', authController.verifyUser);

//############## wysłanie maila do administrtora ############
router.post('/sendEmailToAdmin/',isAuth, authController.sendEmailToAdmin);

//############## wyświetlenie strony do wpisania nowego hasła ############

//router.get('/enterNewPass/:token',authController.enterNewPass);

//############## przypomnienie hasła - wysłanie linka na email ############
router.post('/forgotPass/',authController.forgotPass);

//############## przypomnienie hasła - wpisanie nowego hasła przez uzytkownika ############
router.post('/enterNewPass/:userId/:token',authController.applyNewPass);

//############## logowanie ############

router.post('/login',authController.login);

module.exports = router;