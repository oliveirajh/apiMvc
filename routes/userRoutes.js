const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/login', userController.renderLogin);
router.post('/login', userController.login);
router.get('/register', userController.renderRegister);
router.post('/register', userController.register);

module.exports = router;