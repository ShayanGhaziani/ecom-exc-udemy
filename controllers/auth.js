const User = require('../models/user');

exports.getLogin = (req, res, next) => {
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    isAuthenticated: req.session.isLoggedIn,
  });
};
exports.getSignup = (req, res, next) => {
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'signup',
    isAuthenticated: req.session.isLoggedIn,
  });
};
exports.postSignup = (req, res, next) => {
  console.log('this is the postSignup controller', req.body);
  req.session.isLoggedIn = false;
  const userData = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword
  }
  User.findByPk(userData.email)
    .then(user => {
      if(user){
        return res.redirect('/login');
      }
      const user = new User({
        email: email,
        password: password,
        confirmPassword: confirmPassword,
      })
    })
  res.redirect('/login');
  // User.create({ name: req.body, email: 'test@test.com' })
};

exports.postLogin = (req, res, next) => {
  // console.log(req.body);
  const userData = {
    id: req.body.id,
    email: req.body.email,
    password: req.body.password,
  };
  // console.log(userData)
  User.findByPk(userData.id)
    .then(user => {
      req.session.isLoggedIn = true;
      req.session.user = {
        id: user.id,
        email: user.email
      };
      req.session.save(err => {
        console.log(err);
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

