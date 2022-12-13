var express = require('express');
var router = express.Router();
var path = require('path')
var fs = require('fs')
const { isAdmin } = require('../helpers/middle.js');


module.exports = function (db) {

    router.get('/getitem', isAdmin, async function (req, res, next) {
        try {
            const {rows: forNotif} = await db.query('SELECT barcode, name, stock FROM goods WHERE stock <= 5')
            res.json({getGoods: forNotif})
        } catch (error) {
            res.json(error)
            console.log(error);
        }
    });


    router.get('/countitem', isAdmin, async function (req, res, next) {
        try {
            const {rows: count} = await db.query('SELECT count(*) AS totalalert FROM goods  WHERE stock <= 5')
            res.json({getCount: count})
        } catch (error) {
            res.json(error)
            console.log(error);
        }
    });

return router
}