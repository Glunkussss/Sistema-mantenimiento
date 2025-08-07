// routes/evaluacionRoutes.js

const express = require('express');
const router = express.Router();
const evaluacionController = require('../controllers/evaluacionController');
const { verifyToken, isSupervisor } = require('../middleware/authJwt');

// Rutas protegidas
router.post('/evaluaciones', verifyToken, isSupervisor, evaluacionController.crearEvaluacion);
router.get('/evaluaciones/tecnico/:tecnico_id', verifyToken, isSupervisor, evaluacionController.listarEvaluacionesPorTecnico);
router.get('/evaluaciones/tecnico/:tecnico_id/promedio', verifyToken, isSupervisor, evaluacionController.obtenerPromedioPuntaje);
router.delete('/evaluaciones/:id', verifyToken, isSupervisor, evaluacionController.eliminarEvaluacion);

module.exports = router;