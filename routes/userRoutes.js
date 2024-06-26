const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/login', userController.renderLogin);
router.post('/login', userController.login);
router.get('/register', userController.renderRegister);
router.post('/register', userController.register);
router.get('/logout', userController.logout);
router.get('/deleteUser', userController.deleteUserRender);
router.post('/deleteUser', userController.deleteUser);
router.get('/transfer', userController.transferRender);
router.post('/transfer', userController.transfer);
router.post('/edit', userController.edit);
router.get('/edit', userController.editRender);
router.get('/deposit', userController.depositRender);
router.post('/deposit', userController.deposit);

module.exports = router;