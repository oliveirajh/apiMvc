const express = require('express');
const router = express.Router();
const cofrinhoController = require('../controllers/cofrinhoController');
const checkAuth = require('../middlewares/checkAuth');

router.post("/cofrinho",checkAuth, cofrinhoController.cofrinhoCreate);
router.delete("/cofrinho/:id",checkAuth, cofrinhoController.cofrinhoDelete);
router.post("/cofrinho/add/:id",checkAuth, cofrinhoController.cofrinhoAdd);
router.post("/cofrinho/withdraw/:id",checkAuth, cofrinhoController.cofrinhoWithdraw);
router.put("/cofrinho/:id",checkAuth, cofrinhoController.cofrinhoEdit);

router.get("/cofrinho", checkAuth, cofrinhoController.getAllCofrinhos);
router.get("/cofrinho/:id", checkAuth, cofrinhoController.getOneCofrinho);

module.exports = router;