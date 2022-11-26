var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const saltRounds = 10;
const { isLoggedIn } = require('../helpers/middle.js')

module.exports = function (db) {

  router.get('/user', isLoggedIn, function (req, res, next) {
    res.render('users/isi', { 
      user: req.session.user,
      currentPage: "POS - Users"
    })
  });

  router.get('/datatable', isLoggedIn, async (req, res) => {
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

  router.get('/add', isLoggedIn, function (req, res, next) {
    res.render('users/add', { 
      user: req.session.user,
      currentPage: "POS - Users"
     })
  });


  router.post('/add', isLoggedIn,async function (req, res, next) {
    try {
      const { email, name, password, role } = req.body
      const hash = bcrypt.hashSync(password, saltRounds);
      await db.query("INSERT INTO users(email, name, password, role) VALUES ($1, $2, $3, $4)", [email, name, hash, role])
      res.redirect('/users/user')
    } catch (error) {
      console.log(error);
      res.send(error)
    }
  });

  router.get('/edit/:userid', isLoggedIn, async function (req, res, next) {
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

  router.post('/edit/:userid', isLoggedIn,async function (req, res, next) {
    try {
      const id = req.params.userid
      const { email, name, role } = req.body
      await db.query("UPDATE users SET email = $1, name = $2, role = $3 WHERE userid = $4",[email, name, role, id])
      res.redirect('/users/user')
    } catch (error) {
      console.log(error);
      res.send(error)
    }
  });

  
  router.get('/delete/:userid', isLoggedIn, async function (req, res, next) {
    try {
      const id = req.params.userid
      await db.query("DELETE FROM users WHERE userid = $1", [id])
      res.redirect('/users/user')
    } catch (error) {
      console.log(error);
      res.send(error)
    }
  });

  return router;

}
