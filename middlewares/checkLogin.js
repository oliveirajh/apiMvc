function checkLogin(req, res, next) {
    if(req.session.login != undefined){
        next();
    } else {
        res.redirect('/user/login');
    }
}

module.exports = checkLogin;