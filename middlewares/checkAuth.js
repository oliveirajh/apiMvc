const jwt = require('jsonwebtoken');

const utils = require('../utils/utils');

module.exports = (req, res, next) => {
    const JWT_KEY = utils.JWT_KEY;

    try{
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ mensagem: 'Token não fornecido' });
        }

        const token = authHeader.split(' ')[1]; // Extrai o token após "Bearer"
        if (!token) {
            return res.status(401).json({ mensagem: 'Formato de token inválido' });
        }
        const decodedToken = jwt.verify(token, JWT_KEY);
        req.userData = { email: decodedToken.email, userId: decodedToken.userId };
        next();
    }catch(error)
    {
        res.status(401).json({mensagem: 'Não autenticado'});
    }
}