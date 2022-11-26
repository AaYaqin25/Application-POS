var express = require('express');
var router = express.Router();
const { isLoggedIn } = require('../helpers/middle.js')

module.exports = function (db) {
    router.get('/', isLoggedIn, function (req, res, next) {
      res.render('dashboard/isi', { 
        user: req.session.user,
        currentPage: "POS - Dashboard"
      })
    });

return router
}