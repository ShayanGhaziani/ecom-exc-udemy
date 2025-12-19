const User = require('../models/user');

exports.userAuth = (req, res, next) => {
  if (!req.session.userId) {
    return next();
  }

  User.findById(req.session.userId)
    .then(([rows]) => {
      if (!rows.length) {
        return next();
      }
      req.user = new User(
        rows[0].id,
        rows[0].name,
        rows[0].email
      );
      next();
    })
    .catch(err => next(err));
  // console.log(req.user);
};


exports.getLogin = (req, res, next) => {
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    isAuthenticated: req.session.isLoggedIn,
  });
};

exports.postLogin = (req, res, next) => {
  User.findById(1)
    .then(([user]) => {
      req.session.userId = user[0].id; // Assign valid ID from DB or static 1
      req.session.isLoggedIn = true;
      console.log(req.session, 'user logged in');
      req.session.save(err => {
        if (err) console.log(err);
        res.redirect('/');
      });
    })
    .catch(err => console.log(err));
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

