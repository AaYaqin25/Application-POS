var express = require('express');
var router = express.Router();
const {isLoggedIn} = require('../helpers/middle.js')

module.exports = function (db) {
  router.get('/dashboard', isLoggedIn,function(req, res, next) {
    res.render('dashboard/isi', {user: req.session.user})
  });

  router.get('/user', isLoggedIn, function(req, res, next) {
    res.render('users/isi', {user: req.session.user})
  });
  
  return router;

}
