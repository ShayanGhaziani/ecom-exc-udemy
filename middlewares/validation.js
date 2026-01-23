const { check, body } = require('express-validator');
const User = require('../models/user');

exports.validateSignup = [
    check('email')
        .isEmail()
        .withMessage('Please enter a valid email')
        .normalizeEmail()
        .custom((value, { req }) => {
            // if (value === 'test@test.com') throw new Error('This email is already taken');
            // return true;
            return User.findOne({ where: { email: value } }).then(userDoc => {
                if (userDoc) {
                    return Promise.reject('E-Mail exists already, please pick a different one.');
                }
            });
        }),
    body('password', 'Please enter a password with only numbers and text and at least 5 characters.')
        .isLength({ min: 5 })
        .isAlphanumeric()
        .trim(),
    body('confirmedPassword').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Passwords have to match!');
        }
        return true;
    })
    .trim()
];

exports.validateLogin = [
    body('email')
        .isEmail()
        .withMessage('Please enter a valid email address.')
        .normalizeEmail(),
    body('password', 'Password has to be valid.')
        .isLength({ min: 5 })
        .isAlphanumeric()
        .trim()
];