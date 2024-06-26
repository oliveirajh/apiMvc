const express = require('express');
const router = express.Router();
const cofrinhoController = require('../controllers/cofrinhoController');

router.get("/cofrinho", cofrinhoController.cofrinhoRender);
router.post("/cofrinho", cofrinhoController.cofrinhoCreate);
router.post("/cofrinho/delete/:id", cofrinhoController.cofrinhoDelete);
router.get("/cofrinho/add/:id", cofrinhoController.cofrinhoAddRender);
router.post("/cofrinho/add/:id", cofrinhoController.cofrinhoAdd);
router.get("/cofrinho/withdraw/:id", cofrinhoController.cofrinhoWithdrawRender);
router.post("/cofrinho/withdraw/:id", cofrinhoController.cofrinhoWithdraw);
router.get("/cofrinho/edit/:id", cofrinhoController.cofrinhoEditRender);
router.post("/cofrinho/edit/:id", cofrinhoController.cofrinhoEdit);


module.exports = router;