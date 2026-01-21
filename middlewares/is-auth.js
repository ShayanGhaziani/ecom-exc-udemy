module.exports = (req, res, next) => {
  if (!req.session.isLoggedIn) {
    console.log('unauthenticated access: login first')
    return res.redirect('/login');
  }
  next();
};