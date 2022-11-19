const e = require('connect-flash');
var express = require('express');
var router = express.Router();
const { isLoggedIn } = require('../helpers/middle.js')
var { money } = require('../public/javascripts/util.js')

module.exports = function (db) {
  router.get('/', isLoggedIn, async function (req, res, next) {
    try {
      const { rows: purchases } = await db.query('SELECT sum(totalsum) AS totalpurchases FROM purchases')
      const { rows: sales } = await db.query('SELECT sum(totalsum) AS totalsales FROM sales')
      const { rows: totalSales } = await db.query('SELECT count(invoice) AS total FROM sales')
      const { rows: getPurchases } = await db.query("SELECT to_char(time, 'Mon YY') AS monthly, to_char(time, 'YY-MM') AS sortmonth, sum(totalsum) AS totalpurchases FROM purchases GROUP BY monthly, sortmonth ORDER BY sortmonth")
      const { rows: getSales } = await db.query("SELECT to_char(time, 'Mon YY') AS monthly, to_char(time, 'YY-MM') AS sortmonth, sum(totalsum) AS totalsales FROM sales GROUP BY monthly, sortmonth ORDER BY sortmonth")

      let result = getPurchases.concat(getSales)
      let newData = {}
      let eachMonth = []
      let incomePerMonth = []
      let allData = []

      result.forEach(item => {
        if (newData[item.monthly]) {
          newData[item.monthly] = { monthly: item.monthly, expense: item.totalpurchases ? item.totalpurchases : newData[item.monthly].expense, revenue: item.totalsales ? item.totalsales : newData[item.monthly].revenue }
        } else {
          newData[item.monthly] = { monthly: item.monthly, expense: item.totalpurchases ? item.totalpurchases : 0, revenue: item.totalsales ? item.totalsales : 0 }
          eachMonth.push(item.monthly)
        }
      });

      for (const labaRugi in newData) {
        incomePerMonth.push(newData[labaRugi].revenue - newData[labaRugi].expense)
      }

      for (const data in newData) {
        allData.push({ monthly: newData[data].monthly, expense: newData[data].expense, revenue: newData[data].revenue })
      }
      res.render('dashboard/isi', {
        user: req.session.user,
        currentPage: "POS - Dashboard",
        purchases: purchases[0],
        sales: sales[0],
        totalSales: totalSales[0],
        money,
        allData
      })
    } catch (error) {
      res.json(error)
      console.log(error);
    }

  });


  router.get('/doughnat', isLoggedIn, async function (req, res, next) {
    try {
      const { startdate, enddate } = req.query

      if (startdate && enddate) {
        const { rows: direct } = await db.query('SELECT count(*) AS totaldirect FROM sales WHERE customer = 2 AND time BETWEEN $1 AND $2', [startdate, enddate])
        const { rows: member } = await db.query('SELECT count(*) AS totalmember FROM sales WHERE customer != 2 AND time BETWEEN $1 AND $2', [startdate, enddate])
        res.json({ direct: direct[0].totaldirect, member: member[0].totalmember })
      } else if (startdate) {
        const { rows: direct } = await db.query('SELECT count(*) AS totaldirect FROM sales WHERE customer = 2 AND time >= $1 ', [startdate])
        const { rows: member } = await db.query('SELECT count(*) AS totalmember FROM sales WHERE customer != 2 AND time >= $1 ', [startdate])
        res.json({ direct: direct[0].totaldirect, member: member[0].totalmember })
      } else if (enddate) {
        const { rows: direct } = await db.query('SELECT count(*) AS totaldirect FROM sales WHERE customer = 2 AND time <= $1 ', [enddate])
        const { rows: member } = await db.query('SELECT count(*) AS totalmember FROM sales WHERE customer != 2 AND time <= $1 ', [enddate])
        res.json({ direct: direct[0].totaldirect, member: member[0].totalmember })
      } else {
        const { rows: direct } = await db.query('SELECT count(*) AS totaldirect FROM sales WHERE customer = 2')
        const { rows: member } = await db.query('SELECT count(*) AS totalmember FROM sales WHERE customer != 2')
        res.json({ direct: direct[0].totaldirect, member: member[0].totalmember })
      }
    } catch (error) {
      res.json(error)
      console.log(error);
    }

  });


  router.get('/line', isLoggedIn, async function (req, res, next) {
    try {
      const { startdate, enddate } = req.query

      if (startdate && enddate) {
        const { rows: getPurchases } = await db.query("SELECT to_char(time, 'Mon YY') AS monthly, to_char(time, 'YY-MM') AS sortmonth, sum(totalsum) AS totalpurchases FROM purchases WHERE time BETWEEN $1 AND $2 GROUP BY monthly, sortmonth ORDER BY sortmonth", [startdate, enddate])
        const { rows: getSales } = await db.query("SELECT to_char(time, 'Mon YY') AS monthly, to_char(time, 'YY-MM') AS sortmonth, sum(totalsum) AS totalsales FROM sales WHERE time BETWEEN $1 AND $2 GROUP BY monthly, sortmonth ORDER BY sortmonth", [startdate, enddate])

        let result = getPurchases.concat(getSales)
        let newData = {}
        let eachMonth = []
        let incomePerMonth = []
        result.forEach(item => {
          if (newData[item.monthly]) {
            newData[item.monthly] = { monthly: item.monthly, expense: item.totalpurchases ? item.totalpurchases : newData[item.monthly].expense, revenue: item.totalsales ? item.totalsales : newData[item.monthly].revenue }
          } else {
            newData[item.monthly] = { monthly: item.monthly, expense: item.totalpurchases ? item.totalpurchases : 0, revenue: item.totalsales ? item.totalsales : 0 }
            eachMonth.push(item.monthly)
          }
        });

        for (const labaRugi in newData) {
          incomePerMonth.push(newData[labaRugi].revenue - newData[labaRugi].expense)
        }
        
        res.json({ eachMonth, incomePerMonth })
      } else if (startdate) {
        const { rows: getPurchases } = await db.query("SELECT to_char(time, 'Mon YY') AS monthly, to_char(time, 'YY-MM') AS sortmonth, sum(totalsum) AS totalpurchases FROM purchases WHERE time >= $1  GROUP BY monthly, sortmonth ORDER BY sortmonth", [startdate])
        const { rows: getSales } = await db.query("SELECT to_char(time, 'Mon YY') AS monthly, to_char(time, 'YY-MM') AS sortmonth, sum(totalsum) AS totalsales FROM sales WHERE time >= $1 GROUP BY monthly, sortmonth ORDER BY sortmonth", [startdate])

        let result = getPurchases.concat(getSales)
        let newData = {}
        let eachMonth = []
        let incomePerMonth = []
        result.forEach(item => {
          if (newData[item.monthly]) {
            newData[item.monthly] = { monthly: item.monthly, expense: item.totalpurchases ? item.totalpurchases : newData[item.monthly].expense, revenue: item.totalsales ? item.totalsales : newData[item.monthly].revenue }
          } else {
            newData[item.monthly] = { monthly: item.monthly, expense: item.totalpurchases ? item.totalpurchases : 0, revenue: item.totalsales ? item.totalsales : 0 }
            eachMonth.push(item.monthly)
          }
        });

        for (const labaRugi in newData) {
          incomePerMonth.push(newData[labaRugi].revenue - newData[labaRugi].expense)
        }
        
        res.json({ eachMonth, incomePerMonth })
      } else if (enddate) {
        const { rows: getPurchases } = await db.query("SELECT to_char(time, 'Mon YY') AS monthly, to_char(time, 'YY-MM') AS sortmonth, sum(totalsum) AS totalpurchases FROM purchases WHERE time <= $1  GROUP BY monthly, sortmonth ORDER BY sortmonth", [enddate])
        const { rows: getSales } = await db.query("SELECT to_char(time, 'Mon YY') AS monthly, to_char(time, 'YY-MM') AS sortmonth, sum(totalsum) AS totalsales FROM sales WHERE time <= $1 GROUP BY monthly, sortmonth ORDER BY sortmonth", [enddate])

        let result = getPurchases.concat(getSales)
        let newData = {}
        let eachMonth = []
        let incomePerMonth = []
        result.forEach(item => {
          if (newData[item.monthly]) {
            newData[item.monthly] = { monthly: item.monthly, expense: item.totalpurchases ? item.totalpurchases : newData[item.monthly].expense, revenue: item.totalsales ? item.totalsales : newData[item.monthly].revenue }
          } else {
            newData[item.monthly] = { monthly: item.monthly, expense: item.totalpurchases ? item.totalpurchases : 0, revenue: item.totalsales ? item.totalsales : 0 }
            eachMonth.push(item.monthly)
          }
        });

        for (const labaRugi in newData) {
          incomePerMonth.push(newData[labaRugi].revenue - newData[labaRugi].expense)
        }
        res.json({ eachMonth, incomePerMonth })
      } else {
        const { rows: getPurchases } = await db.query("SELECT to_char(time, 'Mon YY') AS monthly, to_char(time, 'YY-MM') AS sortmonth, sum(totalsum) AS totalpurchases FROM purchases GROUP BY monthly, sortmonth ORDER BY sortmonth")
        const { rows: getSales } = await db.query("SELECT to_char(time, 'Mon YY') AS monthly, to_char(time, 'YY-MM') AS sortmonth, sum(totalsum) AS totalsales FROM sales GROUP BY monthly, sortmonth ORDER BY sortmonth")

        let result = getPurchases.concat(getSales)
        let newData = {}
        let eachMonth = []
        let incomePerMonth = []
        result.forEach(item => {
          if (newData[item.monthly]) {
            newData[item.monthly] = { monthly: item.monthly, expense: item.totalpurchases ? item.totalpurchases : newData[item.monthly].expense, revenue: item.totalsales ? item.totalsales : newData[item.monthly].revenue }
          } else {
            newData[item.monthly] = { monthly: item.monthly, expense: item.totalpurchases ? item.totalpurchases : 0, revenue: item.totalsales ? item.totalsales : 0 }
            eachMonth.push(item.monthly)
          }
        });

        for (const labaRugi in newData) {
          incomePerMonth.push(newData[labaRugi].revenue - newData[labaRugi].expense)
        }
        
        res.json({ eachMonth, incomePerMonth })
      }

    } catch (error) {
      res.json(error)
      console.log(error);
    }

  });

  return router 
}                       