const express = require('express');
const router = express.Router();
const connectController = require('../controllers/stripeConnectController');
const auth = require('../middleware/auth'); // Importante proteger esto

// Crear la cuenta conectada (Paso 1)
router.post('/create-account', auth, connectController.createConnectAccount);

// Generar link para que el usuario llene sus datos (Paso 2)
router.post('/create-link', auth, connectController.createAccountLink);

module.exports = router;