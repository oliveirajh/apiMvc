const Sequelize = require('sequelize');
const connection = require('../database/database');

const Carteira = connection.define(
    'carteira',
    {
        chave: {
            type: Sequelize.STRING,
            primaryKey: true
        },
        saldo: {
            type: Sequelize.DOUBLE,
            allowNull: false
        },
        extrato: {
            type: Sequelize.DATE,
            allowNull: false
        }
    },
    {
        timestamps: false
    }
);

//Carteira.sync({force: true});

module.exports = Carteira;