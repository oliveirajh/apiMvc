const express = require('express');
const Usuario = require('../models/user');
const Cofrinho = require('../models/cofrinho');
const Extrato = require("../models/extrato");
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const checkLogin = require('../middlewares/checkAuth');
const connection = require('../database/database');

exports.cofrinhoCreate = async (req, res, next) => {
    const usuario = req.userData;
    const nome = req.body.name;
    const meta = req.body.goal;

    try {
        if (meta === "") {
            const cofrinho = await Cofrinho.create({
                usuarioId: usuario.userId,
                nome: nome,
            });
            return res.status(201).json({ msg: 'Cofrinho criado com sucesso!', cofrinho: cofrinho });
        } else {
            const cofrinho = await Cofrinho.create({
                usuarioId: usuario.userId,
                nome: nome,
                meta: parseFloat(meta),
            });
            return res.status(201).json({ msg: 'Cofrinho criado com sucesso!', cofrinho: cofrinho });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Ocorreu um erro ao criar o cofrinho.' });
    }
};


exports.cofrinhoDelete = async (req, res, next) => {
    const cofrinhoId = req.params.id;
    const usuarioAtual = req.userData;

    try {
        const cofrinho = await Cofrinho.findOne({ where: { id: cofrinhoId } });

        if (!cofrinho) {
            return res.status(404).json({ msg: 'Cofrinho não encontrado.' });
        }

        if(cofrinho.usuarioId !== usuarioAtual.userId){
            return res.status(401).json({ msg: 'Não autorizado.' });
        }

        const usuario = await Usuario.findOne({ where: { id: usuarioAtual.userId } });

        if (!usuario) {
            return res.status(404).json({ msg: 'Usuário não encontrado.' });
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

        res.status(200).json({ msg: 'Cofrinho excluído com sucesso!' });
    } catch (err) {
        res.status(500).json({ msg: 'Ocorreu um erro ao excluir o cofrinho.' });
    }
};


exports.cofrinhoAdd = async (req, res, next) => {
    const cofrinhoId = req.params.id;
    const usuario = req.userData;
    const valor = parseFloat(req.body.valor);

    if (isNaN(valor) || valor <= 0) {
        return res.status(400).json({ msg: 'Valor de depósito inválido.' });
    }

    try {
        const user = await Usuario.findOne({ where: { id: usuario.userId } });
        if (!user) {
            return res.status(404).json({ msg: 'Usuário não encontrado.' });
        }

        if (user.saldo < valor) {
            return res.status(400).json({ msg: 'Saldo insuficiente para operação.' });
        }

        const cofrinho = await Cofrinho.findOne({ where: { id: cofrinhoId } });
        if (!cofrinho) {
            return res.status(404).json({ msg: 'Cofrinho não encontrado.' });
        }

        if(cofrinho.usuarioId !== usuario.userId){
            return res.status(401).json({ msg: 'Não autorizado.' });
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
        });

        const cofrinhos = await Cofrinho.findOne({ where: {id: cofrinhoId} });

        return res.status(200).json({ msg: 'Depósito efetuado com sucesso!', cofrinhos: cofrinhos });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: 'Ocorreu um erro ao processar sua solicitação.' });
    }
};

exports.cofrinhoWithdraw = async (req, res, next) => {
    const usuario = req.userData
    const cofrinhoId = req.params.id;
    const valorSaque = parseFloat(req.body.valor);

    if (!usuario) {
        return res.status(401).json({ msg: 'Usuário não encontrado.' });
    }

    if (isNaN(valorSaque) || valorSaque <= 0) {
        return res.status(400).json({ msg: 'Valor de saque inválido.' });
    }

    try {
        const cofrinho = await Cofrinho.findOne({ where: { id: cofrinhoId } });
        if (!cofrinho) {
            return res.status(404).json({ msg: 'Cofrinho não encontrado.' });
        }

        if(cofrinho.usuarioId !== usuario.userId){
            return res.status(401).json({msg: "Não Autorizado."});
        }

        if (cofrinho.saldo < valorSaque) {
            return res.status(403).json({msg: "Saldo Insuficiente para sacar"})
        }

        await connection.transaction(async (t) => {
            await cofrinho.update({ saldo: cofrinho.saldo - valorSaque }, { transaction: t });

            const user = await Usuario.findOne({ where: { id: usuario.userId } });
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
                conta_destino: user.email,
                usuarioId: user.id
            }, { transaction: t });
        });

        const cofrinhos = await Cofrinho.findAll({ where: { id: cofrinhoId } });

        return res.status(200).json({msg: "Saque Efetuado com sucesso", cofrinho: cofrinhos})

    } catch (err) {
        console.error(err);
        return res.status(500).json({msg: "Ocorreu um erro ao processar sua solicitação"})
    }
};

exports.cofrinhoEdit = async (req, res, next) => {
    const cofrinhoId = req.params.id;
    const usuario = req.userData
    const name = req.body.name;
    const meta = req.body.goal;

    try {
        const cofrinho = await Cofrinho.findOne({ where: { id: cofrinhoId } });

        if(cofrinho.usuarioId != usuario.userId){
            return res.status(401).json({
                msg: "Não Autorizado!"
            })
        }

        if (!cofrinho) {
            return res.status(404).json({msg: "Cofrinho não Encontrado"})
        }

        if (name !== "") {
            await cofrinho.update({ nome: name });
        }

        if (meta !== "") {
            await cofrinho.update({ meta: parseFloat(meta) });
        } else {
            await cofrinho.update({ meta: null });
        }

        const cofrinhoUpdate = await Cofrinho.findOne({ where: { id: cofrinhoId } });

        return res.status(200).json({ msg: 'Cofrinho atualizado com sucesso!', cofrinho: cofrinhoUpdate });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: 'Ocorreu um erro ao processar sua solicitação.' });
    }
};

exports.getOneCofrinho = async (req, res, next) => {
    /* Busca Apenas um cofrinho */
}

exports.getAllCofrinhos = async (req, res, next) => {
    /* Busca todos os cofrinhos do Usuário */
}

