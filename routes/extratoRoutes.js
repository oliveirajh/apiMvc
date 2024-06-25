const express = require('express');
const router = express.Router();
const extratoController = require('../controllers/extratoController');

router.get("/extratos", extratoController.renderExtrato);

module.exports = router;