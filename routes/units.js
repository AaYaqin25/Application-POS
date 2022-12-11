var express = require('express');
var router = express.Router();
const { isLoggedIn } = require('../helpers/middle.js')

module.exports = function (db) {
    router.get('/', isLoggedIn, function (req, res, next) {
        res.render('units/isi', { 
          user: req.session.user,
          currentPage: "POS - Units"
        })
    });

    router.get('/datatable', isLoggedIn, async (req, res) => {
        let params = []

        if (req.query.search.value) {
            params.push(`unit ilike '%${req.query.search.value}%'`)
        }

        if (req.query.search.value) {
            params.push(`name ilike '%${req.query.search.value}%'`)
        }

        if (req.query.search.value) {
            params.push(`note ilike '%${req.query.search.value}%'`)
        }

        const limit = req.query.length
        const offset = req.query.start
        const sortBy = req.query.columns[req.query.order[0].column].data
        const sortMode = req.query.order[0].dir

        const total = await db.query(`select count(*) as total from units${params.length > 0 ? ` where ${params.join(' or ')}` : ''}`)
        const data = await db.query(`select * from units${params.length > 0 ? ` where ${params.join(' or ')}` : ''} order by ${sortBy} ${sortMode} limit ${limit} offset ${offset} `)
        const response = {
            "draw": Number(req.query.draw),
            "recordsTotal": total.rows[0].total,
            "recordsFiltered": total.rows[0].total,
            "data": data.rows
        }
        res.json(response)
    })


    router.get('/add', isLoggedIn, function (req, res, next) {
        res.render('units/add', { 
          user: req.session.user,
          currentPage: "POS - Units"
        })
      });


      router.post('/add', isLoggedIn,async function (req, res, next) {
        try {
          const { unit, name, note } = req.body
          await db.query("INSERT INTO units(unit, name, note) VALUES ($1, $2, $3)", [unit, name, note])
          res.redirect('/units')
        } catch (error) {
          console.log(error);
          res.send(error)
        }
      });

      router.get('/edit/:unit', isLoggedIn, async function (req, res, next) {
        try {
          const id = req.params.unit
          const getEdit = await db.query("SELECT * FROM units WHERE unit = $1", [id])
          res.render('units/edit', { 
            data: getEdit.rows[0], 
            user: req.session.user,
            currentPage: "POS - Units"
           })
        } catch (error) {
          console.log(error);
          res.send(error)
        }
      });


      router.post('/edit/:unit', isLoggedIn,async function (req, res, next) {
        try {
          const id = req.params.unit
          const { unit, name, note } = req.body
          await db.query("UPDATE units SET unit = $1, name = $2, note = $3 WHERE unit = $4",[unit, name, note, id])
          res.redirect('/units')
        } catch (error) {
          console.log(error);
          res.send(error)
        }
      });


      router.get('/delete/:unit', isLoggedIn, async function (req, res, next) {
        try {
          const id = req.params.unit
          await db.query("DELETE FROM units WHERE unit = $1", [id])
          res.redirect('/units')
        } catch (error) {
          console.log(error);
          res.send(error)
        }
      });

    return router
}   