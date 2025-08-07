// routes/solicitudRoutes.js

const express = require('express');
const router = express.Router();
const solicitudController = require('../controllers/solicitudController');
const { verifyToken } = require('../middleware/authJwt');

// Rutas públicas y protegidas
router.post('/solicitudes', verifyToken, solicitudController.crearSolicitud);
router.get('/solicitudes', verifyToken, solicitudController.listarSolicitudes);
router.get('/solicitudes/:id', verifyToken, solicitudController.obtenerSolicitudPorId);
router.put('/solicitudes/:id/asignar', verifyToken, solicitudController.asignarTecnico);
router.put('/solicitudes/:id/estado', verifyToken, solicitudController.actualizarEstadoSolicitud);

module.exports = router;