const Usuario = require("../models/user");

function checkLogin(req, res, next) {
    if (req.session.login != undefined) {

        const email = req.session.login.usuario;

        Usuario.findOne({
            where: { email: email }
        }).then(usuario => {
            if (usuario) {
                req.session.login = {
                    id: usuario.id,
                    usuario: usuario.email,
                    username: usuario.username,
                    senha: usuario.senha,
                    saldo: usuario.saldo,
                    chave: usuario.chave,
                    email: usuario.email
                };
            }
            next();
        }).catch(err => {
            console.error('Erro ao atualizar a sessão do usuário:', err);
            res.redirect('/user/login');
        });
    } else {
        res.redirect('/user/login');
    }
}

module.exports = checkLogin;