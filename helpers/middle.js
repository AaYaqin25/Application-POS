module.exports = {
    isLoggedIn: function (req, res, next) {
        if (req.session.user) {
            next()
        } else {
            res.redirect('/')
        }
    },

    isAdmin: function (req, res, next) {
        if (req.session.user && req.session.user.role == 'Admin') {
            next()
        } else {
            res.redirect('/sales')
        }
    }
}