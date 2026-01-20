const crypto = require('crypto');
const { Op } = require('sequelize');

const User = require('../models/user');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendGridTransport = require('nodemailer-sendgrid-transport');

const transporter = nodemailer.createTransport(sendGridTransport({
  auth: {
    api_key: process.env.SENDGRID_API_KEY
  }
}))

// const transporter = nodemailer.createTransport({
//     host: 'smtp.ethereal.email',
//     port: 587,
//     auth: {
//         user: 'alvis.jacobson@ethereal.email',
//         pass: '7pPM29AmhtKSVCGKNw'
//     }
// });
exports.getLogin = (req, res, next) => {
  let message = req.flash('error');
  message = message.length > 0 ? message[0] : null;
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: message,
    // errorMessage1: req.flash('email-pass-wrong')
  });
};
exports.getSignup = (req, res, next) => {
  let message = req.flash('error');
  message = message.length > 0 ? message[0] : null;
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'signup',
    // errorMessage: req.flash('error-signup-pass')
    errorMessage: message
  });
};


exports.postSignup = (req, res, next) => {
  const { email, password, confirmedPassword } = req.body;

  if (password !== confirmedPassword) {
    req.flash('error', 'passwords dont match!')
    return res.redirect('/signup');
  }
  User.findOne({ where: { email } })
    .then(user => {
      if (user) {
        req.flash('error', 'User with this email already exists!');
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
      }).catch(err => console.log(err));
    })
    .catch(err => {
      console.log(err);
      res.redirect('/signup');
    });
};



// User.create({ name: req.body, email: 'test@test.com' })


exports.postLogin = (req, res, next) => {
  const { email, password } = req.body;
  // console.log('post login controller:', req.body)

  User.findOne({ where: { email } })
    .then(user => {
      if (!user) {
        // console.log('user doesnt exist!');
        req.flash('error', "user not registered!");
        return res.redirect('/login');
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
              console.log('postLogin save session err handler:', err);
              return res.redirect('/');
            });
          }
          // req.flash('email-pass-wrong', "Email or Password WRONG!");
          req.flash('error', "Email or Password WRONG!");
          return res.redirect('/login');
        })
        .catch(err => {
          console.log(err)
          res.redirect('/login')
        });
    })
    .then(result => {
      if (!result) return;
      res.redirect('/login');
    })
    .catch(err => console.log(err));
};


exports.postLogout = (req, res, next) => {
  console.log(req.body);
  req.session.destroy((err) => {
    console.log('user logged out');
    res.redirect('/login');
  });
};

exports.getReset = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) { message = message[0]; }
  else { message = null; }

  res.render('auth/reset-pass', {
    path: '/reset-pass',
    pageTitle: 'reset pass',
    // errorMessage: req.flash('reset-pass-no-email')
    errorMessage: message
  });
}

exports.postReset = (req, res, next) => {
  const userMail = req.body.email;
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect('/reset-pass');
    }
    const token = buffer.toString('hex');
    User.findOne({ where: { email: userMail } })
      .then(user => {
        if (!user) {
          req.flash('error', "user with this email not found! try again:");
          res.redirect('/reset-pass');
          return null;
          // return Promise.resolve();
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save();
      })
      .then(result => {
        if (!result) { return; }
        res.redirect('/login');
        return transporter.sendMail({
          to: userMail,
          from: 'shayanghaziani@outlook.com',
          subject: 'reset pass',
          html: `
          <p>youve requested a pass reset</p>
          <p>click <a href="http://localhost:3000/reset-pass/${token}">here</a> to reset password</p>
          `
        })
      })
      .catch(err => { console.log(err) })
  })
}

exports.getNewPass = (req, res, next) => {
  let message = req.flash('error');
  message = message.length > 0 ? message[0] : null;

  const token = req.params.token;
  console.log('getNewPass controller token:', token)
  User.findOne({
    where: {
      resetToken: token,
      // resetTokenExpiration: { [Op.gt]: Date.now() } //JS greater than operator
    }
  })
    .then(user => {
      if (!user) {
        req.flash('error', 'Token expired or invalid. Please request a new password reset.');
        return res.redirect('/reset-pass');
      }
      res.render('auth/new-pass', {
        path: '/new-pass',
        pageTitle: 'new pass',
        errorMessage: message,
        userId: user.id.toString(),
        passwordToken: token
      });
    })
    .catch(err => { console.log(err) })
};


exports.postNewPass = (req, res, next) => {
  const { password, confirmedPassword, passwordToken, userId, email } = req.body;
  let resetUserPass;
  console.log('email in postNewPass:', email);

  if (password !== confirmedPassword) {
    req.flash('error', 'Passwords do not match!');
    return res.redirect(req.get('referrer') || '/login');
  }

  User.findOne({
    where: {
      resetToken: passwordToken,
      // resetTokenExpiration: { [Op.gt]: Date.now() },
      id: userId,
      email: email
    }
  })

    .then(user => {
      // console.log(user);
      if (!user) {
        req.flash('error', 'Session expired. Please request a new password reset.');
        return res.redirect('/reset-pass');
      }
      resetUserPass = user;
      return bcrypt.hash(password, 12);
    })
    .then(hashedPassword => {
      if (!hashedPassword) return;

      resetUserPass.resetToken = null;
      resetUserPass.resetTokenExpiration = null;
      resetUserPass.password = hashedPassword;
      // console.log(resetUserPass);

      console.log('Password successfully updated in memory, saving to DB...');
      return resetUserPass.save();
    })
    .then(result => {
      if (!result) return;
      req.flash('success', 'Password reset successful. Please login.');
      res.redirect('/login');
    })
    .catch(err => {
      console.log('Error in postNewPass:', err);
      res.redirect('/login');
    });
};