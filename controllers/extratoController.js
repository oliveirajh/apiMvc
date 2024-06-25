const express = require('express');
const Extrato = require('../models/extrato');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const checkLogin = require('../middlewares/checkLogin');

exports.renderExtrato = (req, res, next) => {
    const usuario = req.session.login;

    Extrato.findAll({
        where: {
            usuarioId: usuario.id
        }
    }).then(extratos => {
        res.render("user/extrato", {
            msg: "",
            extratos: extratos
        });
    });
}