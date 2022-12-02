var express = require('express');
var router = express.Router();
var path = require('path')
var fs = require('fs')
const { currencyFormatter } = require('../public/javascripts/util.js')
const { isLoggedIn } = require('../helpers/middle.js');

module.exports = function (db) {

    router.get('/', isLoggedIn, function (req, res, next) {
        res.render('goods/isi', {
            user: req.session.user,
            currentPage: "POS - Goods",
        })
    });


    router.get('/datatable', isLoggedIn, async (req, res) => {
        let params = []

        if (req.query.search.value) {
            params.push(`name ilike '%${req.query.search.value}%'`)
        }

        if (req.query.search.value) {
            params.push(`unit ilike '%${req.query.search.value}%'`)
        }

        const limit = req.query.length
        const offset = req.query.start
        const sortBy = req.query.columns[req.query.order[0].column].data
        const sortMode = req.query.order[0].dir


        const total = await db.query(`select count(*) as total from goods${params.length > 0 ? ` where ${params.join(' or ')}` : ''}`)
        const data = await db.query(`select * from goods${params.length > 0 ? ` where ${params.join(' or ')}` : ''} order by ${sortBy} ${sortMode} limit ${limit} offset ${offset} `)

        const response = {
            "draw": Number(req.query.draw),
            "recordsTotal": total.rows[0].total,
            "recordsFiltered": total.rows[0].total,
            "data": data.rows,
            currencyFormatter
        }
        res.json(response)
    })


    router.get('/add', isLoggedIn, async function (req, res, next) {
        const dataUnit = await db.query("SELECT * FROM units")
        res.render('goods/add', {
            user: req.session.user,
            data: dataUnit.rows,
            currentPage: "POS - Goods"
        })
    });


    router.post('/add', isLoggedIn, async function (req, res, next) {
        try {
            const { barcode, name, stock, purchaseprice, sellingprice, unit } = req.body

            if (!req.files || Object.keys(req.files).length === 0) {
                res.status(400).send('No files were uploaded.');
                return;
            }

            console.log('req.files >>>', req.files);

            const uploadFile = req.files.picture;
            const fileName = `${Date.now()}-${uploadFile.name}`
            const uploadPath = path.join(__dirname, '..', 'public', 'images', fileName);

            uploadFile.mv(uploadPath, async function (err) {
                if (err) {
                    return res.status(500).send(err);
                }
                await db.query("INSERT INTO goods(barcode, name, stock, purchaseprice, sellingprice, unit, picture) VALUES ($1, $2, $3, $4, $5, $6, $7)", [barcode, name, stock, purchaseprice, sellingprice, unit, fileName])
                res.redirect('/goods')
            });

        } catch (error) {
            console.log(error);
            res.send(error)
        }
    });


    router.get('/edit/:barcode', isLoggedIn, async function (req, res, next) {
        try {
            const id = req.params.barcode
            const getEdit = await db.query("SELECT * FROM goods WHERE barcode = $1", [id])
            const editUnit = await db.query("SELECT * FROM units")
            res.render('goods/edit', {
                data: getEdit.rows[0],
                value: editUnit.rows,
                user: req.session.user,
                currentPage: "POS - Goods"
            })
        } catch (error) {
            console.log(error);
            res.send(error)
        }
    });


    router.post('/edit/:barcode', isLoggedIn, async function (req, res, next) {
        try {
            const id = req.params.barcode
            const { name, stock, purchaseprice, sellingprice, unit } = req.body
            console.log(req.body);
            if (!req.files || Object.keys(req.files).length === 0) {
                await db.query("UPDATE goods SET name = $1, stock = $2, purchaseprice = $3, sellingprice = $4, unit = $5 WHERE barcode = $6", [name, stock, purchaseprice, sellingprice, unit, id])
                res.redirect('/goods')
            } else {
                const uploadFile = req.files.picture;
                const fileName = `${Date.now()}-${uploadFile.name}`
                const uploadPath = path.join(__dirname, '..', 'public', 'images', fileName);

                uploadFile.mv(uploadPath, async function (err) {
                    if (err) {
                        return res.status(500).send(err);
                    }
                    await db.query("UPDATE goods SET name = $1, stock = $2, purchaseprice = $3, sellingprice = $4, unit = $5, picture = $6 WHERE barcode = $7", [name, stock, purchaseprice, sellingprice, unit, fileName, id])
                    res.redirect('/goods')
                })
            }

        } catch (error) {
            console.log(error);
            res.send(error)
        }
    });

    router.get('/delete/:barcode', isLoggedIn, async function (req, res, next) {
        try {
          const id = req.params.barcode

          const getPict = await db.query("SELECT * FROM goods")
          const getDelPict = getPict.rows[0].picture
          const deletePict = path.join(__dirname, '..', 'public', 'images', getDelPict)

          fs.unlinkSync(deletePict)
          await db.query("DELETE FROM goods WHERE barcode = $1", [id])
          res.redirect('/goods')
        } catch (error) {
          console.log(error);
          res.send(error)
        }
      });
    

    return router
}