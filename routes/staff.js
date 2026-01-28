const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const auth = require('../middleware/auth'); // Tu middleware de autenticación (JWT)

// Todas las rutas requieren estar logueado (y ser admin/manager preferiblemente)
router.get('/', auth, staffController.getStaff);
router.post('/', auth, staffController.createStaff);
router.put('/:id', auth, staffController.updateStaff);
router.patch('/:id/toggle', auth, staffController.toggleStatus);
router.delete('/:id', auth, staffController.deleteStaff);

module.exports = router;