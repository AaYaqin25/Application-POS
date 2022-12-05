var express = require('express');
var router = express.Router();
const { isLoggedIn } = require('../helpers/middle.js')
var {money} = require('../public/javascripts/util.js')

module.exports = function (db) {
    router.get('/', isLoggedIn, async function (req, res, next) {
      const {rows: purchases} = await db.query('SELECT sum(totalsum) AS totalpurchases FROM purchases')
      const {rows: sales} = await db.query('SELECT sum(totalsum) AS totalsales FROM sales')
      const {rows: totalSales} = await db.query('SELECT count(invoice) AS total FROM sales')
      
      res.render('dashboard/isi', { 
        user: req.session.user,
        currentPage: "POS - Dashboard",
        purchases: purchases[0],
        sales: sales[0],
        totalSales: totalSales[0],
        money,
      })
    });


    router.get('/pie', isLoggedIn, async function (req, res, next) {
      const {rows: getCustomer} = await db.query('SELECT customer FROM sales')
      
      let direct = 0
      let member = 0
      
      getCustomer.forEach(item => {
        if (item.customer != 2) {
          return member++
        }
        direct++
      });
      res.json({direct, member})
    });
    

return router
}