module.exports = (req, res, next) => {
  if (!req.session.isLoggedIn) {
    console.log('unauthorized access: login first')
    return res.redirect('/login');
  }
  next();
};