var express = require('express');
var router = express.Router();
const { isLoggedIn } = require('../helpers/middle.js')


module.exports = function (db) {

    router.get('/', isLoggedIn, function (req, res, next) {
        res.render('suppliers/isi', {
            user: req.session.user,
            currentPage: "POS - Suppliers"
        })
    });


    router.get('/datatable', isLoggedIn, async (req, res) => {
        let params = []
    
        if (req.query.search.value) {
          params.push(`name ilike '%${req.query.search.value}%'`)
        }
    
        if (req.query.search.value) {
          params.push(`address ilike '%${req.query.search.value}%'`)
        }

        if (req.query.search.value) {
            params.push(`phone ilike '%${req.query.search.value}%'`)
          }
    
        const limit = req.query.length
        const offset = req.query.start
        const sortBy = req.query.columns[req.query.order[0].column].data
        const sortMode = req.query.order[0].dir
    
        const total = await db.query(`select count(*) as total from suppliers${params.length > 0 ? ` where ${params.join(' or ')}` : ''}`)
        const data = await db.query(`select * from suppliers${params.length > 0 ? ` where ${params.join(' or ')}` : ''} order by ${sortBy} ${sortMode} limit ${limit} offset ${offset} `)
        const response = {
          "draw": Number(req.query.draw),
          "recordsTotal": total.rows[0].total,
          "recordsFiltered": total.rows[0].total,
          "data": data.rows
        }
        res.json(response)
      })

      router.get('/add', isLoggedIn, function (req, res, next) {
        res.render('suppliers/add', { 
          user: req.session.user,
          currentPage: "POS - Suppliers"
        })
      });

      router.post('/add', isLoggedIn,async function (req, res, next) {
        try {
          const { name, address, phone } = req.body
          await db.query("INSERT INTO suppliers(name, address, phone) VALUES ($1, $2, $3)", [name, address, phone])
          res.redirect('/suppliers')
        } catch (error) {
          console.log(error);
          res.send(error)
        }
      });


      router.get('/edit/:supplierid', isLoggedIn, async function (req, res, next) {
        try {
          const id = req.params.supplierid
          const getEdit = await db.query("SELECT * FROM suppliers WHERE supplierid = $1", [id])
          res.render('suppliers/edit', { 
            data: getEdit.rows[0], 
            user: req.session.user,
            currentPage: "POS - Suppliers"
           })
        } catch (error) {
          console.log(error);
          res.send(error)
        }
      });


      router.post('/edit/:supplierid', isLoggedIn,async function (req, res, next) {
        try {
          const id = req.params.supplierid
          const { name, address, phone } = req.body
          await db.query("UPDATE suppliers SET name = $1, address = $2, phone = $3 WHERE supplierid = $4",[name, address, phone, id])
          res.redirect('/suppliers')
        } catch (error) {
          console.log(error);
          res.send(error)
        }
      });

      router.get('/delete/:supplierid', isLoggedIn, async function (req, res, next) {
        try {
          const id = req.params.supplierid
          await db.query("DELETE FROM suppliers WHERE supplierid = $1", [id])
          res.redirect('/suppliers')
        } catch (error) {
          console.log(error);
          res.send(error)
        }
      });
    
    return router;
}