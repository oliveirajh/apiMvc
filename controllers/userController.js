const express = require('express');
const Usuario = require('../models/user');
const bcrypt = require('bcryptjs');
const Wallet = require('../models/wallet');

exports.renderLogin = (req, res, next) => {
    res.render('user/login', {msg: ''});
}

exports.login = (req, res, next) => {
    const email = req.body.email;
    const senha = req.body.password;

    Usuario.findOne({
        where: {
            email: email
        }
    }).then(usuario => {
        if(usuario != undefined){
            if(bcrypt.compareSync(senha, usuario.senha)){
                req.session.login = {
                    usuario: usuario.email,
                    username: usuario.username,
                };
                res.redirect('/');
            } else {
                res.render('user/login', {msg: 'Usuário ou senha inválidos.'});
            }
        } else {
            res.render('user/login', {msg: 'Usuário ou senha inválidos.'});
        }
    });
}

exports.renderRegister = (req, res, next) => {
    res.render('user/register', {msg: ''});
}

exports.register = (req, res, next) => {
    const email = req.body.email;
    const senha = req.body.senha;
    const username = req.body.username;

    Usuario.findOne({
        where: {
            email: email
        }
    }).then(usuario => {
        if (usuario == undefined){
            const salt = bcrypt.genSaltSync();
            const senhaCriptografada = bcrypt.hashSync(senha, salt);
            const currentDate = new Date();
            const formattedDate = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')} ${currentDate.getHours().toString().padStart(2, '0')}:${currentDate.getMinutes().toString().padStart(2, '0')}:${currentDate.getSeconds().toString().padStart(2, '0')}`;

            Usuario.create({
                username: username,
                email: email,
                senha: senhaCriptografada
            }).then(newUser => {
                Wallet.create({
                    chave: newUser.id.toString(),
                    saldo: 0.0,
                    extrato: `Usuário cadastrado: ${formattedDate}`
                }).then(() => {
                    res.render("user/login", {msg: "Usuário cadastrado com sucesso!"});
                }).catch(error => {
                    res.render("user/login", {msg: `Erro ao criar carteira para usuário: ${error}`});
                });
            }).catch(error => {
                if(error.name == "SequelizeUniqueConstraintError") {
                    res.render("user/login", {msg: "Usuário não cadastrado: Email ou nome de usuário já está em uso."});
                } else {
                    res.render("user/login", {msg: `Erro ao cadastrar usuário: ${error}`});
                }
            });
        } else {
            res.render("user/login", {msg: "Usuário não cadastrado: Email ou nome de usuário já está em uso."});
        }
    });
}
