const express = require('express');

const authController = require('../controllers/auth');

const router = express.Router();

router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);

router.post('/logout', authController.postLogout);

router.get('/signup', authController.getSignup);
router.post('/signup', authController.postSignup);

router.get('/reset-pass', authController.getReset);
router.post('/reset-pass', authController.postReset);

router.get('/reset-pass/:token', authController.getNewPass);
router.post('/new-pass', authController.postNewPass);

module.exports = router;