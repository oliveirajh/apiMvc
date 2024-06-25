const express = require('express');
const Usuario = require('../models/user');
const Extrato = require('../models/extrato');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const checkLogin = require('../middlewares/checkLogin');
const connection = require('../database/database');

exports.renderLogin = (req, res, next) => {
    res.render('user/login', {msg: ''});
}

exports.logout = (req, res, next) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Erro ao encerrar a sessão:', err);
            res.redirect('/');
        } else {
            res.redirect('/user/login');
        }
    });
};

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
                    saldo: usuario.saldo,
                    chave: usuario.chave
                };
                res.redirect('/');
            } else {
                res.render('user/login', {msg: 'Usuário ou senha inválidos.'});
            }
        } else {
            res.render('user/login', {msg: 'Usuário não encontrado.'});
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
                senha: senhaCriptografada,
                saldo: 0.0,
                chave: uuidv4()
            }).then(() => {
                    res.render("user/login", {msg: "Usuário cadastrado com sucesso!"});
                }).catch(error => {
                    res.render("user/login", {msg: `Erro ao criar carteira para usuário: ${error}`});
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


exports.deleteUser = (req, res, next) => {
    const usuario = req.session.login;


    Usuario.destroy({
        where: {
            email: usuario.usuario
        }
    }).then(() => {
        Extrato.destroy({
            where:{
                usuarioId: null
            }
        }).then(() => {
            req.session.destroy();
        res.render('user/login', {msg: "Conta deletada com sucesso!"});
        });
    }).catch (err =>{
        console.error(`Erro ao deletar usuário: ${err}`)
    });
    
}

exports.transferRender = (req, res, next) => {
    res.render('user/transfer', {msg: ''});
}

exports.transfer = async (req, res, next) => {
    const t = await connection.transaction();
    try {
        const usuario = req.session.login;
        const { email, saldo: saldoRemetente } = usuario;
        const { chave, valor, descricao } = req.body;
        const valorTransferencia = parseFloat(valor);
        const novoSaldo = saldoRemetente - valorTransferencia;

        if (chave === usuario.chave) {
            return res.render("user/transfer", { msg: "Você não pode enviar saldo para si mesmo!" });
        }

        const remetente = await Usuario.findOne({ 
            where: { email: email },
            transaction: t
        });

        if (!remetente) {
            await t.rollback();
            return res.render('user/transfer', { msg: "Erro: Não foi possível encontrar o usuário remetente." });
        }

        if (novoSaldo < 0) {
            await t.rollback();
            return res.render('user/transfer', { msg: "Saldo insuficiente." });
        }

        const destinatario = await Usuario.findOne({ 
            where: { chave: chave },
            transaction: t
        });

        if (!destinatario) {
            await t.rollback();
            return res.render('user/transfer', { msg: "Destinatário não encontrado." });
        }

        await remetente.update({ saldo: novoSaldo }, { transaction: t });
        await Extrato.create({
            data_transacao: new Date(),
            tipo_transacao: 'Pagamento',
            valor: valor,
            saldo_apos_transacao: novoSaldo,
            descricao: descricao || "Transferência para " + destinatario.username,
            categoria: "Transação",
            conta_destino: destinatario.email,
            usuarioId: remetente.id
        }, { transaction: t });

        await destinatario.update({ saldo: destinatario.saldo + valorTransferencia }, { transaction: t });
        await Extrato.create({
            data_transacao: new Date(),
            tipo_transacao: 'Recebimento',
            valor: valor,
            saldo_apos_transacao: destinatario.saldo,
            descricao: descricao || "Transferência de " + remetente.username,
            categoria: "Transação",
            conta_destino: destinatario.email,
            usuarioId: destinatario.id
        }, { transaction: t });

        await t.commit();

        req.session.login.saldo = novoSaldo;
        return res.redirect('/');
    } catch (err) {
        await t.rollback();
        return res.render('user/transfer', { msg: `Erro: ${err.message}` });
    }
};
