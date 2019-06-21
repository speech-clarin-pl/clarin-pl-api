const express = require('express');
const { body } = require('express-validator/check'); // for validation
const router = express.Router();

const User = require('../models/user');
const authController = require('../controllers/auth');

router.put('/registration',[
    body('email').isEmail().withMessage('Please write a valid email')
        .custom((value, {req}) => {
            //sprawdzam czy juz istnieje w bazie
            return User.findOne({email: value}).then(userDoc => {
                if(userDoc){
                    return Promise.reject('Email address already exists!');
                }
            })
        })
        .normalizeEmail(),
    body('password').trim().isLength({min: 6}),
    body('name').trim().not().isEmpty()
], authController.registration);

module.exports = router;