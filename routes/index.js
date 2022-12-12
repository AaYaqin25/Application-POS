var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const saltRounds = 10;
const { isLoggedIn } = require('../helpers/middle.js')

module.exports = function (db) {
  router.get('/', function (req, res, next) {
    res.render('login', {
      failureMessage: req.flash('failureMessage'),
      successMessage: req.flash('successMessage')
    });
  });

  router.post('/', async function (req, res, next) {
    try {
      const { email, password } = req.body
      const findReg = await db.query("SELECT * FROM users WHERE email = $1", [email])
      if (findReg.rows.length == 0) {
         req.flash('failureMessage', "Wrong Email")
         return res.redirect('/')
      }

      const checkPassword = bcrypt.compareSync(password, findReg.rows[0].password);
      if (!checkPassword) {
        req.flash('failureMessage', 'Wrong Password')
        return res.redirect('/')
      }

      req.session.user = {id: findReg.rows[0].userid, email: findReg.rows[0].email, nickname: findReg.rows[0].name, role: findReg.rows[0].role }
   
      res.redirect('/home')
    } catch (error) {
      console.log("gagal", error);
    }
  });

  router.get('/home', isLoggedIn, function (req, res, next) {
    res.redirect('/dashboard')
  });

  router.get('/register', function (req, res, next) {
    res.render('register');
  });

  router.post('/register', async function (req, res, next) {
    try {
      const { email, nickname, password, role } = req.body
      const hash = bcrypt.hashSync(password, saltRounds);
      await db.query("INSERT INTO users(email, name, password, role) VALUES ($1, $2, $3, $4)", [email, nickname, hash, role])
      req.flash('successMessage', 'Account has been created')
      res.redirect('/')
    } catch (error) {
      console.log("gagal", error);
    }
  });

  router.get('/logout', function (req, res, next) {
    req.session.destroy(function (err) {
      res.redirect('/')
    })
  })

  return router;
}
