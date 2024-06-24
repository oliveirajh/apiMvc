const express = require('express');
const Usuario = require('../models/user');
const bcrypt = require('bcryptjs');

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
                    username: usuario.username
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
            email:email
        }
    }).then(usuario => {

        if (usuario == undefined){
            const salt = bcrypt.genSaltSync();
            const senhaCriptografada = bcrypt.hashSync(senha, salt);

            Usuario.create({
                username:username,
                email:email,
                senha: senhaCriptografada
            }).then(()=>{
                res.render("user/login", {msg: "Usuário cadastrado com sucesso!"})
            }).catch(error => {
                if(error.name == "SequelizeUniqueConstraintError") {
                    res.render("user/login", {msg: "Usuário não cadastrado: Email ou nome de usuário já está em uso."})
                } else {
                    res.render("user/login", {msg: `Erro ao cadastrar usuário: ${error}`});
                }
            });
        } else {
            res.render("user/login", {msg: "Usuário não cadastrado: Email ou nome de usuário já está em uso."})
        }
    })
}