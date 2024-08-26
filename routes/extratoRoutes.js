const express = require('express');
const router = express.Router();
const extratoController = require('../controllers/extratoController');
const checkAuth = require('../middlewares/checkAuth');

router.get("/extratos",checkAuth, extratoController.getAll);
router.get("/extratos/:id",checkAuth, extratoController.getOne);

module.exports = router;