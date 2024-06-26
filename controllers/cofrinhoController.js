const express = require('express');
const Usuario = require('../models/user');
const Cofrinho = require('../models/cofrinho');
const Extrato = require("../models/extrato");
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const checkLogin = require('../middlewares/checkLogin');
const connection = require('../database/database');

exports.cofrinhoCreate = async (req, res, next) => {
    const usuario = req.session.login;
    const nome = req.body.name;
    const meta = req.body.goal;

    try {
        if (meta === "") {
            await Cofrinho.create({
                usuarioId: usuario.id,
                nome: nome,
            });
        } else {
            await Cofrinho.create({
                usuarioId: usuario.id,
                nome: nome,
                meta: parseFloat(meta),
            });
        }

        res.redirect("/");
    } catch (err) {
        console.error(err);
        res.render('index', { msg: 'Ocorreu um erro ao criar o cofrinho.' });
    }
};


exports.cofrinhoDelete = async (req, res, next) => {
    const cofrinhoId = req.params.id;

    try {
        const cofrinho = await Cofrinho.findOne({ where: { id: cofrinhoId } });

        if (!cofrinho) {
            const usuario = req.session.login;
            const cofrinhos = await Cofrinho.findAll({ where: { usuarioId: usuario.id } });
            return res.render('index', { msg: 'Cofrinho não encontrado.', cofrinhos: cofrinhos });
        }

        const usuario = await Usuario.findOne({ where: { id: cofrinho.usuarioId } });

        if (!usuario) {
            const cofrinhos = await Cofrinho.findAll({ where: { usuarioId: usuario.id } });
            return res.render('index', { msg: 'Usuário não encontrado.', cofrinhos: cofrinhos });
        }

        await usuario.update({ saldo: usuario.saldo + cofrinho.saldo });

        await connection.transaction(async (t) => {
            await Extrato.create({
                data_transacao: new Date(),
                tipo_transacao: 'Recebimento',
                valor: cofrinho.saldo,
                saldo_apos_transacao: usuario.saldo,
                descricao: `Cofrinho excluído: ${cofrinho.nome}`,
                categoria: 'Cofrinho',
                conta_destino: usuario.email,
                usuarioId: usuario.id
            }, { transaction: t });
        });

        await cofrinho.destroy();

        req.session.login.saldo = usuario.saldo;

        const cofrinhos = await Cofrinho.findAll({ where: { usuarioId: usuario.id } });

        res.render('index', { msg: 'Cofrinho excluído com sucesso!', cofrinhos: cofrinhos });
    } catch (err) {
        console.error(err);
        const usuario = req.session.login;
        const cofrinhos = await Cofrinho.findAll({ where: { usuarioId: usuario.id } });
        res.render('index', { msg: 'Ocorreu um erro ao excluir o cofrinho.', cofrinhos: cofrinhos });
    }
};


exports.cofrinhoAddRender = (req, res, next) => {
    const cofrinhoId = req.params.id;
    res.render("user/addCofrinho", {
        msg: "",
        cofrinhoId: cofrinhoId,
        usuario: req.session.login
    });
}

exports.cofrinhoAdd = async (req, res, next) => {
    const cofrinhoId = req.params.id;
    const usuario = req.session.login;
    const valor = parseFloat(req.body.valor);

    if (!usuario) {
        return res.render('index', { msg: 'Usuário não está logado.' });
    }

    if (isNaN(valor) || valor <= 0) {
        return res.render('index', { msg: 'Valor inválido.' });
    }

    try {
        const user = await Usuario.findOne({ where: { id: usuario.id } });
        if (!user) {
            return res.render('index', { msg: 'Usuário não encontrado.' });
        }

        if (user.saldo < valor) {
            return res.render('user/addCofrinho', { msg: 'Saldo insuficiente.', cofrinhoId: cofrinhoId });
        }

        const cofrinho = await Cofrinho.findOne({ where: { id: cofrinhoId } });
        if (!cofrinho) {
            return res.render('index', { msg: 'Cofrinho não encontrado.' });
        }

        await connection.transaction(async (t) => {
            await user.update({ saldo: user.saldo - valor }, { transaction: t });
            await cofrinho.update({ saldo: cofrinho.saldo + valor }, { transaction: t });

            await Extrato.create({
                data_transacao: new Date(),
                tipo_transacao: 'Pagamento',
                valor: valor,
                saldo_apos_transacao: user.saldo,
                descricao: `Depósito no cofrinho: ${cofrinho.nome}`,
                categoria: 'Cofrinho',
                conta_destino: 'Cofrinho',
                usuarioId: usuario.id
            }, { transaction: t });

            req.session.login.saldo = user.saldo;
        });

        const cofrinhos = await Cofrinho.findAll({ where: { usuarioId: usuario.id } });

        res.render('index', {
            msg: 'Depósito efetuado com sucesso!',
            cofrinhos: cofrinhos
        });

    } catch (err) {
        console.error(err);
        res.render('user/addCofrinho', { msg: 'Ocorreu um erro ao processar sua solicitação.', cofrinhoId: cofrinhoId });
    }
};


exports.cofrinhoRender = (req, res, next) => {
    res.render("user/cofrinho", {
        msg: ""
    });
}

exports.cofrinhoWithdrawRender = async (req, res, next) => {
    const cofrinhoId = req.params.id;

    const cofrinho = await Cofrinho.findOne({where:{id: cofrinhoId}}).then(cofrinho => {
        res.render("user/cofrinhoWithdraw", {msg:"", cofrinho: cofrinho, cofrinhoId: cofrinhoId})
    });
}


exports.cofrinhoWithdraw = async (req, res, next) => {
    const cofrinhoId = req.params.id;
    const usuario = req.session.login;
    const valorSaque = parseFloat(req.body.valor);

    if (!usuario) {
        const cofrinhos = await Cofrinho.findAll({ where: { usuarioId: usuario.id } });
        return res.render('index', { msg: 'Usuário não está logado.', cofrinhos: cofrinhos });
    }

    if (isNaN(valorSaque) || valorSaque <= 0) {
        const cofrinhos = await Cofrinho.findAll({ where: { usuarioId: usuario.id } });
        return res.render('user/cofrinho', { msg: 'Valor de saque inválido.', cofrinhos: cofrinhos });
    }

    try {
        const cofrinho = await Cofrinho.findOne({ where: { id: cofrinhoId } });
        if (!cofrinho) {
            const cofrinhos = await Cofrinho.findAll({ where: { usuarioId: usuario.id } });
            return res.render('index', { msg: 'Cofrinho não encontrado.', cofrinhos: cofrinhos });
        }

        if (cofrinho.saldo < valorSaque) {
            const cofrinhos = await Cofrinho.findAll({ where: { usuarioId: usuario.id } });
            return res.render(`user/cofrinhoWithdraw`, { msg: 'Saldo insuficiente no cofrinho.', cofrinho: cofrinho, cofrinhoId: cofrinhoId, cofrinhos: cofrinhos });
        }

        await connection.transaction(async (t) => {
            await cofrinho.update({ saldo: cofrinho.saldo - valorSaque }, { transaction: t });

            const user = await Usuario.findOne({ where: { id: usuario.id } });
            if (!user) {
                throw new Error('Usuário não encontrado.');
            }

            await user.update({ saldo: user.saldo + valorSaque }, { transaction: t });

            await Extrato.create({
                data_transacao: new Date(),
                tipo_transacao: 'Recebimento',
                valor: valorSaque,
                saldo_apos_transacao: user.saldo,
                descricao: `Saque do cofrinho: ${cofrinho.nome}`,
                categoria: 'Cofrinho',
                conta_destino: usuario.email,
                usuarioId: usuario.id
            }, { transaction: t });

            req.session.login.saldo = user.saldo;
        });

        const cofrinhos = await Cofrinho.findAll({ where: { usuarioId: usuario.id } });

        res.render("index", {
            msg: 'Saque efetuado com sucesso!',
            cofrinhos: cofrinhos
        });

    } catch (err) {
        console.error(err);
        const cofrinhos = await Cofrinho.findAll({ where: { usuarioId: usuario.id } });
        res.render('index', { msg: 'Ocorreu um erro ao processar sua solicitação.', cofrinhos: cofrinhos });
    }
};


exports.cofrinhoEditRender = async (req, res, next) => {
    const cofrinhoId = req.params.id;

    const cofrinho = await Cofrinho.findOne({where:{id: cofrinhoId}}).then(cofrinho => {
        res.render("user/cofrinhoEdit", {msg:"", cofrinho: cofrinho, cofrinhoId: cofrinhoId})
    });
}

exports.cofrinhoEdit = async (req, res, next) => {
    const cofrinhoId = req.params.id;
    const name = req.body.name;
    const meta = req.body.goal;

    try {
        const cofrinho = await Cofrinho.findOne({ where: { id: cofrinhoId } });

        if (!cofrinho) {
            return res.render('index', { msg: 'Cofrinho não encontrado.' });
        }

        if (name !== "") {
            await cofrinho.update({ nome: name });
        }

        if (meta !== "") {
            await cofrinho.update({ meta: parseFloat(meta) });
        } else {
            await cofrinho.update({ meta: null });
        }

        const usuario = req.session.login;
        const cofrinhos = await Cofrinho.findAll({ where: { usuarioId: usuario.id } });

        res.render('index', { msg: 'Cofrinho atualizado com sucesso!', cofrinhos: cofrinhos });
    } catch (err) {
        console.error(err);
        res.render('index', { msg: 'Ocorreu um erro ao atualizar o cofrinho.' });
    }
};

