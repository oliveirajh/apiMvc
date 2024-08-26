const express = require('express');
const Usuario = require('../models/user');
const Extrato = require('../models/extrato');
const Cofrinho = require('../models/cofrinho');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const connection = require('../database/database');
const utils = require('../utils/utils');

exports.login = (req, res, next) => {
    const JWT_KEY = utils.JWT_KEY;
    const email = req.body.email;
    const senha = req.body.senha;
    let erro = false;
    let usuarioEncontrado;

    if(email === undefined || senha === undefined)
    {
        res.status(400).json({
            mensagem: 'Credenciais inválidas!'
        });
    }
    else {
        Usuario.findOne({
            where: {
                email: email
            }
        }).then(usuario => {
            if(!usuario)
            {
                erro = true;
                return res.status(401).json({
                    mensagem: 'Credenciais inválidas!'
                });
            }
            else
            {
                usuarioEncontrado = usuario;
                return bcrypt.compare(senha, usuario.senha);
            }
        }).then(resultado => {
            if(!erro)
            {
                if(!resultado)
                {
                    return res.status(401).json({
                        mensagem: 'Credenciais inválidas!'
                    });
                }
                const token = jwt.sign(
                    {email: usuarioEncontrado.email, userId: usuarioEncontrado.id},
                    JWT_KEY,
                    {expiresIn: '1h'}
                );
                res.status(200).json({
                    token: token,
                    expiresIn: '3600'
                });
            }
        }).catch(err => {
            console.log(err);
            return res.status(401).json({
                mensagem: 'Credenciais inválidas!'
            });
        });
    }
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
            }).then(usuarioCriado => {
                    res.status(201).json({ mensagem: 'Usuário criado com sucesso!', usuario: { id: usuarioCriado.id, email: usuarioCriado.email, saldo: usuarioCriado.saldo, chave: usuarioCriado.chave } });
                }).catch(error => {
                    res.status(500).json({ mensagem: `Erro ao Criar Carteira para ussuário ${error}` });
                }).catch(error => {
                    if(error.name == "SequelizeUniqueConstraintError") {
                        res.status(409).json({ mensagem: "Usuário já cadastrado!" });
                    } else {
                        res.status(500).json({ mensagem: `Erro ao criar usuário ${error}` });
                    }
                });
        } else {
            res.status(409).json({ mensagem: "Usuário já cadastrado!" });
        }
    });
}

exports.deleteUser = (req, res, next) => {
    const usuario = req.params.id
    const usuarioAtual = req.userData

    console.log(usuarioAtual)
    console.log(usuario)

    if(usuario != usuarioAtual.userId){
        res.status(401).json({"msg": "Você não tem permissão para deletar este usuário!"})
    }else{
        Usuario.destroy({
            where: {
                id: req.params.id
            }
        }).then(() => {
            Extrato.destroy({
                where:{
                    usuarioId: null
                }
            }).then(() => {
                res.status(200).json({"msg": "Usuário deletado com sucesso!"});
            });
        }).catch (err =>{
            console.error(`Erro ao deletar usuário: ${err}`)
        });
    }
}

exports.edit = async (req, res, next) => {
    const username = req.body.username;
    const email = req.body.email;
    const oldPassword = req.body.password0;
    const password = req.body.password1;
    const passwordCheck = req.body.password2;
    const usuarioAtual = req.userData
    const usuario = req.params.id

    if(req.params.id != usuarioAtual.userId){
        res.status(401).json({"msg": "Você não tem permissão para editar este usuário!"})
    }
    try {
        if (username) {
            const usuarioEncontrado = await Usuario.findOne({ where: {username: username} });
            if (usuarioEncontrado) {
                res.status(409).json({ mensagem: "Nome de usuário já cadastrado, por favor, tente outro." });
                return ;
            } else {
                const usuarioAtual = await Usuario.findOne({ where: { id: usuario } });
                if (usuarioAtual) {
                    await usuarioAtual.update({ username: username });
                }
            }
        }

        if (email) {
            const usuarioEncontrado = await Usuario.findOne({ where: {email: email} });
            if (usuarioEncontrado) {
                res.status(409).json({ mensagem: "Email já cadastrado, por favor, tente outro." });
                return ;
            } else {
                const usuarioAtual = await Usuario.findOne({ where: { id: usuario } });
                if (usuarioAtual) {
                    await usuarioAtual.update({ email: email });
                }
            }
        }

        if (password) {
            if (password == passwordCheck) {
                const usuarioAtual = await Usuario.findOne({ where: { id: usuario } });
                if (usuarioAtual) {
                    const senhaCorreta = bcrypt.compareSync(oldPassword, usuarioAtual.senha);
                    if (senhaCorreta) {
                        const salt = bcrypt.genSaltSync();
                        const senhaCriptografada = bcrypt.hashSync(password, salt);
                        await usuarioAtual.update({ senha: senhaCriptografada });
                    } else {
                        res.status(401).json({ mensagem: "Senha antiga incorreta." });
                        return ;
                    }
                }
            } else {
                res.status(400).json({ mensagem: "Senhas não conferem." });
                return ;
            }
        }

        res.status(200).json({ mensagem: "Usuário atualizado com sucesso." });
    } catch (err) {
        next(err);
    }
}

exports.transfer = async (req, res, next) => {
    const t = await connection.transaction();
    try {
        const usuario = await Usuario.findOne({ where: { id: req.userData.userId }, transaction: t });
        const { email, saldo: saldoRemetente } = usuario;
        const chave = req.params.chave;
        const { valor, descricao } = req.body;
        const valorTransferencia = parseFloat(valor);
        const novoSaldo = saldoRemetente - valorTransferencia;

        if (chave === usuario.chave) {
            return res.status(400).json({ mensagem: "Você não pode transferir para você mesmo." });
        }

        const remetente = await Usuario.findOne({ where: { id: req.userData.userId }, transaction: t });
    

        if (!remetente) {
            await t.rollback();
            return res.status(404).json({ mensagem: "Remetente não encontrado." });
        }

        if (novoSaldo < 0) {
            await t.rollback();
            return res.status(400).json({ mensagem: "Saldo insuficiente para realizar transferência." });
        }

        const destinatario = await Usuario.findOne({ 
            where: { chave: chave },
            transaction: t
        });


        if (!destinatario) {
            await t.rollback();
            return res.status(404).json({ mensagem: "Destinatário não encontrado." });
            
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
        res.status(200).json({ mensagem: "Transferência realizada com sucesso." });
    } catch (err) {
        await t.rollback();
        res.status(500).json({ mensagem: "Erro ao realizar transferência." });
    }
};

exports.deposit = async (req, res, next) => {
    const usuario = req.params.id;
    const usuarioAuth = req.userData;
    const valorDeposito = parseFloat(req.body.valor);

    if (isNaN(valorDeposito) || valorDeposito <= 0) {
        return res.status(400).json({ msg: 'Valor de depósito inválido.'});
    }

    if(usuario != usuarioAuth.userId){
        res.status(401).json({"msg": "Você não tem permissão para depositar neste usuário!"})
    }

    try {
        const usuarioAtual = await Usuario.findOne({ where: { id: usuarioAuth.userId } });

        if (!usuarioAtual) {
            return res.status(404).json({ msg: 'Usuário não encontrado.' });
        }
        const saldoNovo = usuarioAtual.saldo + valorDeposito;
        await usuarioAtual.update({ saldo: saldoNovo });

        const cofrinhos = await Cofrinho.findAll({ where: { usuarioId: usuario } });

        await connection.transaction(async (t) => {
            await Extrato.create({
                data_transacao: new Date(),
                tipo_transacao: 'Recebimento',
                valor: valorDeposito,
                saldo_apos_transacao: saldoNovo,
                descricao: 'Depósito bancário',
                categoria: 'Cofrinho',
                conta_destino: usuarioAtual.email,
                usuarioId: usuarioAtual.id
            }, { transaction: t });
        });

        return res.status(200).json({ msg: 'Depósito realizado com sucesso.', saldo: saldoNovo, valorDeposito: valorDeposito });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: 'Ocorreu um erro ao realizar o depósito.' });
    }
};

exports.getUser = async (req, res, next) => {
    const usuario = req.userData;
    const usuarioId = req.params.id;
    try {
        const usuario = await Usuario.findOne({ where: { id: req.params.id } });
        if (!usuario) {
            return res.status(404).json({ msg: 'Usuário não encontrado.' });
        }
        return res.status(200).json({ usuario: usuario });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: 'Ocorreu um erro ao buscar o usuário.' });
    }
};

exports.getAllUsers = async (req, res, next) => {
    const usuario = req.userData;
    try {
        const usuarios = await Usuario.findAll();
        return res.status(200).json({ usuarios: usuarios });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: 'Ocorreu um erro ao buscar os usuários.' });
    }
};