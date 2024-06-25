const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/login', userController.renderLogin);
router.post('/login', userController.login);
router.get('/register', userController.renderRegister);
router.post('/register', userController.register);
router.get('/logout', userController.logout);
router.get('/deleteUser', userController.deleteUser);
router.get('/transfer', userController.transferRender);
router.post('/transfer', userController.transfer);

module.exports = router;