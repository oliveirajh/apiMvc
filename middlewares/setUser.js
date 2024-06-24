function setUser(req, res, next) {
    if (req.session.login) {
        res.locals.usuario = req.session.login;
    }
    next();
}

module.exports = setUser;