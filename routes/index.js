var express = require('express');
var router = express.Router();
var config = require('../config');

/* check whether the user logs in or not*/
function isLogin(req) {
    if(req.cookies && req.cookies[config.COOKIENAME]) return true;
    else return false;
}

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: config.APPNAME, showHeader: true, isLogin: isLogin(req), cookie: config.COOKIENAME });
});

/* GET sign in page. */
router.get('/signin', function(req, res, next) {
    res.render('signin', { title: config.APPNAME, showHeader: false, cookie: config.COOKIENAME });
});

/* GET sign up page. */
router.get('/signup', function(req, res, next) {
    res.render('signup', { title: config.APPNAME, showHeader: false });
});

/* GET sign out page. */
router.get('/signout', function(req, res, next) {
    res.clearCookie(config.COOKIENAME);
    res.redirect('/');
});

/* GET profile page. */
router.get('/profile', function(req, res, next) {
    if(!isLogin(req)) res.redirect('/signin');
    else res.render('profile', { title: config.APPNAME, showHeader: true, isLogin: isLogin(req), cookie: config.COOKIENAME });
});

/* GET individual restaurant page. */
router.get('/restaurant/:restaurantId', function(req, res, next) {
    var restaurantId = req.params.restaurantId;

    res.render('restaurant', { title: config.APPNAME, showHeader: true, isLogin: isLogin(req),  id: restaurantId, cookie: config.COOKIENAME });
});

/* GET new restaurant page. */
router.get('/newrestaurant', function(req, res, next) {
    if(!isLogin(req)) res.redirect('/signin');
    else res.render('newrestaurant', { title: config.APPNAME, showHeader: true, isLogin: isLogin(req), cookie: config.COOKIENAME });
});

module.exports = router;
