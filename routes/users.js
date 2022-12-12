var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const saltRounds = 10;
const { isAdmin, isLoggedIn } = require('../helpers/middle.js');

module.exports = function (db) {

  router.get('/', isAdmin, function (req, res, next) {
    res.render('users/isi', {
      user: req.session.user,
      currentPage: "POS - Users"
    })
  });

  router.get('/datatable', isAdmin, async (req, res) => {
    let params = []

    if (req.query.search.value) {
      params.push(`name ilike '%${req.query.search.value}%'`)
    }

    if (req.query.search.value) {
      params.push(`email ilike '%${req.query.search.value}%'`)
    }

    const limit = req.query.length
    const offset = req.query.start
    const sortBy = req.query.columns[req.query.order[0].column].data
    const sortMode = req.query.order[0].dir

    const total = await db.query(`select count(*) as total from users${params.length > 0 ? ` where ${params.join(' or ')}` : ''}`)
    const data = await db.query(`select * from users${params.length > 0 ? ` where ${params.join(' or ')}` : ''} order by ${sortBy} ${sortMode} limit ${limit} offset ${offset} `)
    const response = {
      "draw": Number(req.query.draw),
      "recordsTotal": total.rows[0].total,
      "recordsFiltered": total.rows[0].total,
      "data": data.rows
    }
    res.json(response)
  })

  router.get('/add', isAdmin, function (req, res, next) {
    res.render('users/add', {
      user: req.session.user,
      currentPage: "POS - Users"
    })
  });


  router.post('/add', isAdmin, async function (req, res, next) {
    try {
      const { email, name, password, role } = req.body
      const hash = bcrypt.hashSync(password, saltRounds);
      await db.query("INSERT INTO users(email, name, password, role) VALUES ($1, $2, $3, $4)", [email, name, hash, role])
      res.redirect('/users')
    } catch (error) {
      console.log(error);
      res.send(error)
    }
  });

  router.get('/edit/:userid', isAdmin, async function (req, res, next) {
    try {
      const id = req.params.userid
      const getEdit = await db.query("SELECT * FROM users WHERE userid = $1", [id])
      res.render('users/edit', {
        data: getEdit.rows[0],
        user: req.session.user,
        currentPage: "POS - Users"
      })
    } catch (error) {
      console.log(error);
      res.send(error)
    }
  });

  router.post('/edit/:userid', isAdmin, async function (req, res, next) {
    try {
      const id = req.params.userid
      const { email, name, role } = req.body
      await db.query("UPDATE users SET email = $1, name = $2, role = $3 WHERE userid = $4", [email, name, role, id])
      res.redirect('/users')
    } catch (error) {
      console.log(error);
      res.send(error)
    }
  });


  router.get('/delete/:userid', isAdmin, async function (req, res, next) {
    try {
      const id = req.params.userid
      await db.query("DELETE FROM users WHERE userid = $1", [id])
      res.redirect('/users')
    } catch (error) {
      console.log(error);
      res.send(error)
    }
  });


  router.get('/profile', isLoggedIn, function (req, res, next) {
    res.render('users/profile', {
      user: req.session.user,
      currentPage: "POS - Users",
      failureMessage: req.flash('failureMessage'),
      successMessage: req.flash('successMessage')
    })
  });


  router.post('/profile', isLoggedIn, async function (req, res, next) {
    try {
      const { email, name } = req.body

      await db.query("UPDATE users SET email = $1, name = $2 WHERE userid = $3", [email, name, req.session.user.id])
      const { rows: updateUser } = await db.query("SELECT * FROM users WHERE email = $1", [email])

      req.session.user = { id: updateUser[0].userid, email: updateUser[0].email, nickname: updateUser[0].name, role: updateUser[0].role }
      req.flash('successMessage', 'Your profile has been updated')
      res.redirect('/users/profile')
    } catch (error) {
      console.log(error);
      res.send(error)
    }
  });


  router.get('/changepassword', isLoggedIn, function (req, res, next) {
    res.render('users/changepassword', {
      user: req.session.user,
      currentPage: "POS - Users",
      failureMessage: req.flash('failureMessage'),
      successMessage: req.flash('successMessage')
    })
  });


  router.post('/changepassword', isLoggedIn, async function (req, res, next) {
    try {
      const { oldpassword, newpassword, retypepassword } = req.body

      const { rows: passwordOld } = await db.query("SELECT * FROM users WHERE userid = $1", [req.session.user.id])
      const checkPassword = bcrypt.compareSync(oldpassword, passwordOld[0].password);
      if (!checkPassword) {
        req.flash('failureMessage', 'Old Password is Wrong ')
        return res.redirect('/users/changepassword')
      }

      if (newpassword != retypepassword) {
        req.flash('failureMessage', "Retype Password dosen't match")
        return res.redirect('/users/changepassword')
      }

      const hashNewPassword = bcrypt.hashSync(newpassword, saltRounds);
      await db.query("UPDATE users SET password = $1 WHERE userid = $2", [hashNewPassword, req.session.user.id])
      req.flash('successMessage', 'Your password has been updated')
      res.redirect('/users/changepassword')

    } catch (error) {
      console.log(error);
      res.send(error)
    }
  });

  return router;

}
