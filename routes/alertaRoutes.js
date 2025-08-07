// routes/alertaRoutes.js

const express = require('express');
const router = express.Router();
const alertaController = require('../controllers/alertaController');
const { verifyToken } = require('../middleware/authJwt');

// Rutas protegidas
router.get('/alertas/tareas/pendientes', verifyToken, alertaController.obtenerTareasPendientes);
router.get('/alertas/verificar', verifyToken, alertaController.verificarAlertas);

module.exports = router;