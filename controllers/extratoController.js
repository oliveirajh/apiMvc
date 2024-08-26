const express = require('express');
const Extrato = require('../models/extrato');

exports.getAll = (req, res, next) => {
    const usuario = req.userData;

    try{
        Extrato.findAll({
            where: {
                usuarioId: usuario.userId
            }
        }).then(extratos => {
            res.status(200).json(extratos);
        });
    }catch(error){
        res.status(500).json({mensagem: 'Erro ao buscar extratos'});
    }
}

exports.getOne = (req, res, next) => {
    const extratoId = req.params.id;
    const usuario = req.userData;

    try{
        Extrato.findOne({
            where: {
                id_transacao: extratoId,
                usuarioId: usuario.userId
            }
        }).then(extrato => {
            if(!extrato){
                return res.status(404).json({mensagem: 'Extrato não encontrado'});
            }
            res.status(200).json(extrato);
        });
    }catch(error){
        res.status(500).json({mensagem: 'Erro ao buscar extrato'});
    }
}