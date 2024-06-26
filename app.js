const express = require('express');
const path = require('path');
const app = express();
const session = require('express-session');
const connection = require('./database/database');
const setUser = require("./middlewares/setUser");

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


// Sessions
app.use(session({
    secret: 'projeto1',
    cookie: {
        maxAge: 1200000,
    },
    resave: false,
    saveUninitialized: false
}));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(setUser);

// Banco de Dados
connection.authenticate().then(() => {
    console.log('Conexão feita com sucesso!');
}).catch(erro => {
    console.log('Problemas na conexão!');
    console.log(erro);
});

// Middlewares
const cofrinhos = require("./middlewares/cofrinhos");
const checkLogin = require("./middlewares/checkLogin");

// Rotas
const userRoutes = require("./routes/userRoutes");
const extratoRoutes = require("./routes/extratoRoutes");
const cofrinhoRoutes = require("./routes/cofrinhoRoutes");

app.use('/user', userRoutes, extratoRoutes, cofrinhoRoutes);

app.get('/', checkLogin, cofrinhos, (req, res, next) => {
    res.render('index', {msg: ""});
});

module.exports = app;