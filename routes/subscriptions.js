const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const auth = require('../middleware/auth'); // Opcional si proteges la creación

// Crear sesión (llamado desde Registro o Dashboard)
router.post('/create-checkout-session', subscriptionController.createCheckoutSession);

// Verificar pago (llamado por Stripe success_url)
router.get('/verify-payment', subscriptionController.verifyPayment);

// Cancelar pago (llamado por Stripe cancel_url)
router.get('/cancelled-payment', subscriptionController.cancelledPayment);

module.exports = router;