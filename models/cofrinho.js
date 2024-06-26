const Sequelize = require('sequelize');
const User = require('./user');
const connection = require('../database/database');


const Cofrinho = connection.define(
    'cofrinho', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    nome: {
        type: Sequelize.STRING,
        allowNull: false
    },
    saldo: {
        type: Sequelize.DOUBLE,
        defaultValue: 0.0
    },
    meta: {
        type: Sequelize.DOUBLE,
        allowNull: true
    }
}, {
    timestamps: false
});

Cofrinho.belongsTo(User);

//Cofrinho.sync({ force: true });

module.exports = Cofrinho;
