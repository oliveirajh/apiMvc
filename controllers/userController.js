const express = require('express');
const Usuario = require('../models/user');
const Extrato = require('../models/extrato');
const Cofrinho = require('../models/cofrinho');
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

exports.deleteUserRender = (req, res, next) => {
    res.render("user/delete", {msg: ""});
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

exports.edit = async (req, res, next) => {
    const username = req.body.username;
    const email = req.body.email;
    const oldPassword = req.body.password0;
    const password = req.body.password1;
    const passwordCheck = req.body.password2;

    try {
        if (username) {
            const usuarioEncontrado = await Usuario.findOne({ where: { username: username } });
            if (usuarioEncontrado) {
                return res.render('user/edit', { msg: "Nome de usuário já existe, por favor, tente outro." });
            } else {
                const usuario = req.session.login;
                const usuarioAtual = await Usuario.findOne({ where: { id: usuario.id } });
                if (usuarioAtual) {
                    await usuarioAtual.update({ username: username });
                    req.session.login.username = username;
                }
            }
        }

        if (email) {
            const usuarioEncontrado = await Usuario.findOne({ where: { email: email } });
            if (usuarioEncontrado) {
                return res.render('user/edit', { msg: "Email já cadastrado, por favor, tente outro." });
            } else {
                const usuario = req.session.login;
                const usuarioAtual = await Usuario.findOne({ where: { id: usuario.id } });
                if (usuarioAtual) {
                    await usuarioAtual.update({ email: email });
                    req.session.login.email = email;
                }
            }
        }

        if (password) {
            if (password == passwordCheck) {
                const usuario = req.session.login;
                const usuarioAtual = await Usuario.findOne({ where: { id: usuario.id } });
                if (usuarioAtual) {
                    const senhaCorreta = bcrypt.compareSync(oldPassword, usuarioAtual.senha);
                    if (senhaCorreta) {
                        const salt = bcrypt.genSaltSync();
                        const senhaCriptografada = bcrypt.hashSync(password, salt);
                        await usuarioAtual.update({ senha: senhaCriptografada });
                        req.session.login.senha = senhaCriptografada;
                    } else {
                        return res.render('user/edit', { msg: "Senha antiga incorreta." });
                    }
                }
            } else {
                return res.render('user/edit', { msg: "Senhas não coincidem." });
            }
        }

        const cofrinhos = await Cofrinho.findAll({ where: { usuarioId: req.session.login.id } });
        return res.render("index", { msg: "Dados salvos com sucesso!", cofrinhos: cofrinhos });
    } catch (err) {
        next(err);
    }
};

exports.editRender = (req, res, next) => {
    res.render('user/edit', {
        usuario: req.session.login,
        msg: ""
    });
}


exports.depositRender = async(req, res, next) => {
    res.render("user/deposit", {msg: ""});
}

exports.deposit = async (req, res, next) => {
    const usuario = req.session.login;
    const valorDeposito = parseFloat(req.body.valor);

    if (isNaN(valorDeposito) || valorDeposito <= 0) {
        const cofrinhos = await Cofrinho.findAll({ where: { usuarioId: usuario.id } });
        return res.render('index', { msg: 'Valor de depósito inválido.', cofrinhos: cofrinhos });
    }

    try {
        const usuarioAtual = await Usuario.findOne({ where: { id: usuario.id } });

        if (!usuarioAtual) {
            const cofrinhos = await Cofrinho.findAll({ where: { usuarioId: usuario.id } });
            return res.render('index', { msg: 'Usuário não encontrado.', cofrinhos: cofrinhos });
        }

        await usuarioAtual.update({ saldo: usuarioAtual.saldo + valorDeposito });

        req.session.login.saldo = usuarioAtual.saldo;
        const cofrinhos = await Cofrinho.findAll({ where: { usuarioId: usuario.id } });

        await connection.transaction(async (t) => {
            await Extrato.create({
                data_transacao: new Date(),
                tipo_transacao: 'Recebimento',
                valor: valorDeposito,
                saldo_apos_transacao: usuario.saldo,
                descricao: 'Depósito bancário',
                categoria: 'Cofrinho',
                conta_destino: usuario.email,
                usuarioId: usuario.id
            }, { transaction: t });
        });

        res.render('index', { msg: 'Valor depositado com sucesso!', cofrinhos: cofrinhos });

    } catch (err) {
        console.error(err);
        const cofrinhos = await Cofrinho.findAll({ where: { usuarioId: usuario.id } });
        res.render('index', { msg: 'Ocorreu um erro ao depositar o valor.', cofrinhos: cofrinhos });
    }
};
