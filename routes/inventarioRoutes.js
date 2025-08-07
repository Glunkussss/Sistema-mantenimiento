const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventarioController');
const { verifyToken, isSupervisor } = require('../middleware/authJwt');

// Rutas protegidas
router.post('/inventario', verifyToken, isSupervisor, inventarioController.crearRecurso);
router.get('/inventario', verifyToken, inventarioController.listarRecursos); // Todos pueden ver
router.get('/inventario/:id', verifyToken, inventarioController.obtenerRecurso); // Todos pueden ver
router.put('/inventario/:id', verifyToken, isSupervisor, inventarioController.actualizarRecurso);
router.put('/inventario/:id/cantidad', verifyToken, isSupervisor, inventarioController.actualizarCantidad);
router.delete('/inventario/:id', verifyToken, isSupervisor, inventarioController.eliminarRecurso);

module.exports = router;