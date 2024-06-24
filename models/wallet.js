const Sequelize = require('sequelize');
const connection = require('../database/database');

const Wallet = connection.define(
    'wallet', {
        chave: {
            type: Sequelize.STRING,
            primaryKey: true,
            allowNull: false
        },
        saldo: {
            type: Sequelize.DOUBLE,
            allowNull: false,
            defaultValue: 0.0
        },
        extrato: {
            type: Sequelize.TEXT,
            allowNull: true
        }
    }, {
        timestamps: false
    }
);

//Wallet.sync({force:true});

module.exports = Wallet;
