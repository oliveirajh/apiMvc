const Sequelize = require('sequelize');
require('dotenv').config();

const connection = new Sequelize(
    process.DATABASE,
    process.DB_USERNAME,
    process.DB_PASSWORD,
    {
        host: 'localhost',
        dialect: 'mysql',
        timezone: '-03:00'
    }
);

module.exports = connection;