// routes/mantenimientoRoutes.js

const express = require('express');
const router = express.Router();
const mantenimientoController = require('../controllers/mantenimientoController');
const { verifyToken, isSupervisor } = require('../middleware/authJwt');

// Rutas protegidas
router.post('/mantenimientos', verifyToken, isSupervisor, mantenimientoController.crearMantenimiento);
router.get('/mantenimientos', verifyToken, mantenimientoController.listarMantenimientos);
router.get('/mantenimientos/:id', verifyToken, mantenimientoController.obtenerMantenimientoPorId);
router.put('/mantenimientos/:id/ejecutar', verifyToken, isSupervisor, mantenimientoController.marcarEjecutado);
router.put('/mantenimientos/:id/estado', verifyToken, isSupervisor, mantenimientoController.actualizarEstado);

module.exports = router;