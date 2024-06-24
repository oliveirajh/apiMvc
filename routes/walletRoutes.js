const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');

router.get('/login', walletController.initialize);

module.exports = router;