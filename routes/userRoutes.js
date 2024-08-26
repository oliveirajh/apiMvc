const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const checkAuth = require('../middlewares/checkAuth');

router.post('/login', userController.login);
router.post('/register', userController.register);
router.delete('/:id',checkAuth, userController.deleteUser);
router.put('/:id',checkAuth, userController.edit);
router.post('/deposit/:id',checkAuth, userController.deposit);
router.post('/transfer/:chave',checkAuth, userController.transfer);
/*

router.get('/:id',checkAuth, userController.getUser)
router.get('/',checkAuth, userController.getAllUsers);

*/
module.exports = router;