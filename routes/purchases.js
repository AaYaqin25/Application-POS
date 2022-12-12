var express = require('express');
var router = express.Router();
var moment = require('moment')
const { isLoggedIn } = require('../helpers/middle.js');

module.exports = function (db) {

    router.get('/', isLoggedIn, async function (req, res, next) {
        try {
            const { rows } = await db.query('SELECT * FROM purchases')
            res.render('purchases/isi', {
                user: req.session.user,
                currentPage: "POS - Purchases",
                data: rows[0]
            })
        } catch (error) {
            res.json(error)
            console.log(error);
        }
    });


    router.get('/datatable', isLoggedIn, async (req, res) => {
        let params = []

        if (req.query.search.value) {
            params.push(`invoice ilike '%${req.query.search.value}%'`)
        }

        const limit = req.query.length
        const offset = req.query.start
        const sortBy = req.query.columns[req.query.order[0].column].data
        const sortMode = req.query.order[0].dir


        const total = await db.query(`select count(*) as total from purchases${params.length > 0 ? ` where ${params.join(' or ')}` : ''}`)
        const data = await db.query(`SELECT purchases.*, suppliers.* FROM purchases LEFT JOIN suppliers ON purchases.supplier = suppliers.supplierid${params.length > 0 ? ` where ${params.join(' or ')}` : ''} order by ${sortBy} ${sortMode} limit ${limit} offset ${offset} `)
        const response = {
            "draw": Number(req.query.draw),
            "recordsTotal": total.rows[0].total,
            "recordsFiltered": total.rows[0].total,
            "data": data.rows,
        }
        res.json(response)
    })

    router.get('/create', isLoggedIn, async function (req, res, next) {
        try {
            const { userid } = req.session.user
            const { supplier } = req.body
            const inputPurchases = await db.query('INSERT INTO purchases(totalsum, supplier, operator) VALUES(0, $1, $2) returning *', [userid, supplier])
            res.redirect(`/purchases/show/${inputPurchases.rows[0].invoice}`)
        } catch (error) {
            console.log(error);
            res.jsonp(error)
        }
    });


    router.get('/show/:invoice', isLoggedIn, async function (req, res, next) {
        try {
            const getInv = await db.query('SELECT purchases.*, suppliers.* FROM purchases LEFT JOIN suppliers ON purchases.supplier = suppliers.supplierid WHERE invoice = $1', [req.params.invoice])
            const getAdd = await db.query('SELECT * FROM goods ORDER BY barcode')
            const getSupp = await db.query('SELECT * FROM suppliers ORDER BY supplierid')
            res.render('purchases/form', {
                user: req.session.user,
                currentPage: "POS - Purchases",
                data: getInv.rows[0],
                value: getAdd.rows,
                result: getSupp.rows,
                moment
            })
        } catch (error) {
            console.log(error);
            res.json(error)
        }
    });


    router.post('/show/:invoice', isLoggedIn, async (req, res) => {
        try {
            const { invoice } = req.params
            const { totalsummary, suppliername } = req.body
            const userid  = req.session.user.id

            if (suppliername) {
                await db.query('UPDATE purchases SET totalsum = $1, supplier = $2, operator = $3 WHERE invoice = $4', [totalsummary, suppliername, userid, invoice])
            } else {
                await db.query('UPDATE purchases SET totalsum = $1, operator = $2 WHERE invoice = $3', [totalsummary, userid, invoice])
            }

            res.redirect('/purchases')
        } catch (error) {
            console.log(error)
            return res.redirect('/purchases')
        }
    });


    router.get('/goods/:barcode', isLoggedIn, async function (req, res, next) {
        try {
            const { rows } = await db.query('SELECT * FROM goods WHERE barcode = $1', [req.params.barcode])
            res.json(rows[0])
        } catch (error) {
            res.json(error)
            console.log(error);
        }
    });


    router.post('/additem', isLoggedIn, async function (req, res, next) {
        try {
            const { invoice, itemcode, quantity } = req.body

            await db.query('INSERT INTO purchaseitems(invoice, itemcode, quantity) VALUES ($1, $2, $3)', [invoice, itemcode, quantity])
            const data = await db.query('SELECT * FROM purchases WHERE invoice = $1', [invoice])

            res.json(data.rows[0])
        } catch (error) {
            res.json(error)
            console.log(error);
        }
    });


    router.get('/details/:invoice', isLoggedIn, async function (req, res, next) {
        try {
            const { rows } = await db.query('SELECT purchaseitems.*, goods.name FROM purchaseitems LEFT JOIN goods ON purchaseitems.itemcode = goods.barcode WHERE purchaseitems.invoice = $1 ORDER BY purchaseitems.id', [req.params.invoice])
            res.json(rows)
        } catch (error) {
            res.json(error)
            console.log(error);
        }
    });

    router.get('/deleteitems/:id', isLoggedIn, async (req, res, next) => {
        try {
            const { id } = req.params
            const { rows } = await db.query('DELETE FROM purchaseitems WHERE id = $1 returning *', [id])

            res.redirect(`/purchases/show/${rows[0].invoice}`)
        } catch (err) {
            console.log(err)
        }
    });


    router.get('/delete/:invoice', isLoggedIn, async (req, res, next) => {
        try {
            const invoice = req.params.invoice

            await db.query('DELETE FROM purchases WHERE invoice = $1', [invoice])

            res.redirect('/purchases')
        } catch (err) {
            console.log(err)
        }
    });


    return router

}