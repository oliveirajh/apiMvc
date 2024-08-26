const express = require('express');
const path = require('path');
const app = express();
const connection = require('./database/database');
require('dotenv').config();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Banco de Dados
connection.authenticate().then(() => {
    console.log('Conexão feita com sucesso!');
}).catch(erro => {
    console.log('Problemas na conexão!');
    console.log(erro);
});

// Middlewares
const checkLogin = require("./middlewares/checkAuth");

// Rotas
const userRoutes = require("./routes/userRoutes");
const extratoRoutes = require("./routes/extratoRoutes");
const cofrinhoRoutes = require("./routes/cofrinhoRoutes");

app.use('/user', userRoutes, extratoRoutes, cofrinhoRoutes);

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers',
      'Origin, X-Requested-Width, Content-Type, Accept, Authorization'
    );
    res.setHeader('Access-Control-Allow-Methods',
      'GET, POST, PATCH, PUT, DELETE, OPTIONS'
    );
    next();
})

app.get('/', (req, res, next) => {
    res.json({ message: 'Hello World!' });
});

module.exports = app;