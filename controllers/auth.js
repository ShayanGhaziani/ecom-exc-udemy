const User = require('../models/user');

exports.userAuth = (req, res, next) => {
  next();
};


exports.getLogin = (req, res, next) => {
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    isAuthenticated: req.session.isLoggedIn,
  });
};

exports.postLogin = (req, res, next) => {
  next();
};
exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    console.log('user logged out');
    res.redirect('/login');
  });
};

exports.isAuth = (req, res, next) => {
  if (!req.session.isLoggedIn) {
    return res.redirect('/login');
  }
  next();
};

