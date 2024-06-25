const Sequelize = require('sequelize');
const connection = require('../database/database');
const User = require('./user');


const Extrato = connection.define(
    'extrato', {
        id_transacao: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        data_transacao: {
            type: Sequelize.DATE,
            allowNull: false
        },
        tipo_transacao: {
            type: Sequelize.STRING(50),
            allowNull: false
        },
        valor: {
            type: Sequelize.DECIMAL(15, 2),
            allowNull: false
        },
        saldo_apos_transacao: {
            type: Sequelize.DECIMAL(15, 2),
            allowNull: false
        },
        descricao: {
            type: Sequelize.TEXT,
            allowNull: true
        },
        categoria: {
            type: Sequelize.STRING(50),
            allowNull: true
        },
        conta_destino: {
            type: Sequelize.STRING,
            allowNull: false
        }
}, {
    timestamps: false
});

Extrato.belongsTo(User);

//Extrato.sync({ force: true });

module.exports = Extrato;
