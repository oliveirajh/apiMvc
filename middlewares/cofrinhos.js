const Usuario = require("../models/user");
const Cofrinho = require("../models/cofrinho");

function cofrinhoData(req, res, next) {
    const usuario = req.session.login;

    Cofrinho.findAll({
        where:{
            usuarioId: usuario.id
        }
    }).then(cofrinhos => {
        res.render("index", {
            msg: '',
            usuario: usuario,
            cofrinhos: cofrinhos
        })
    });
}

module.exports = cofrinhoData;