const Sequelize = require('sequelize');
const connection = require('../database/database');
const Wallet = require('./wallet');

const Usuario = connection.define(
    'usuario', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    username: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    },
    email: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
    },
    senha: {
        type: Sequelize.STRING,
        allowNull: false
    }
}, {
    timestamps: false
});

Usuario.hasOne(Wallet);

//Usuario.sync({ force: true });

module.exports = Usuario;
