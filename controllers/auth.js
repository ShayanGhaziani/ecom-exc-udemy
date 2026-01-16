const User = require('../models/user');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendGridTransport = require('nodemailer-sendgrid-transport');

const transporter = nodemailer.createTransport(sendGridTransport({
  auth: {
    api_key: process.env.SENDGRID_API_KEY
  }
}))

exports.getLogin = (req, res, next) => {
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: req.flash('error')
  });
};
exports.getSignup = (req, res, next) => {
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'signup',
    errorMessage: req.flash('error-signup-pass')
  });
};
exports.postSignup = (req, res, next) => {
  const { email, password, confirmedPassword } = req.body;

  if (password !== confirmedPassword) {
    return res.redirect('/signup');
  }

  User.findOne({ where: { email } })
    .then(user => {
      if (user) {
        req.flash('error-signup-pass', 'User with this email already exists!');
        res.redirect('/signup'); 
        return Promise.resolve();
      }
      return bcrypt.hash(password, 12);
    })
    .then(hashedPassword => {
      if (!hashedPassword) return Promise.resolve();
      return User.create({
        email,
        password: hashedPassword
      });
    })
    .then(result => {
      if (!result) return;
      res.redirect('/login');
      return transporter.sendMail({
        to: email,
        from: 'shayanghaziani@outlook.com',
        subject: 'signup succeeded',
        html: '<h1> you successfully signed up!</h1>'
      }).catch( err => console.log(err));
    })
    .catch(err => {
      console.log(err);
      res.redirect('/signup');
    });
};



// User.create({ name: req.body, email: 'test@test.com' })


exports.postLogin = (req, res, next) => {
  const { email, password } = req.body;
  console.log(req.body)
  User.findOne({ where: { email } })
    .then(user => {
      if (!user) {
        // console.log('user doesnt exist!');
        req.flash('error', "user not registered!");
        res.redirect('/login');
      }
      bcrypt.compare(password, user.password)
        .then(isMatched => {
          // console.log('passwords matched', isMatched)
          if (isMatched) {
            res.locals.userId = user.id;
            // console.log('userId:', res.locals.userId);
            req.session.isLoggedIn = true;
            req.session.user = {
              id: user.id,
              email: user.email
            };
            return req.session.save(err => {
              console.log(err);
              res.redirect('/');
            });
          }
          res.redirect('/login');
        })
        .catch(err => {
          console.log(err)
          res.redirect('/login')
        });
      // else if (user.password === req.body.password) {
      //   // console.log('entered pass:', req.body.password, 'db pass:', user.password)
      //   req.session.isLoggedIn = true;
      //   req.session.user = {
      //     id: user.id,
      //     email: user.email
      //   };
      //   req.session.save(err => {
      //     console.log(err);
      //     res.redirect('/');
      //   });
      // }
      // else {
      //   console.log('wrong password!')
      //   res.redirect('/login');
      // }
    })
    .then(result => {
      if (!result) return;
      res.redirect('/login');
    })
    .catch(err => console.log(err));
};
exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    console.log('user logged out');
    res.redirect('/login');
  });
};



