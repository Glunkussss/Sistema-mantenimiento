// routes/evidenciaRoutes.js

const express = require('express');
const router = express.Router();
const evidenciaController = require('../controllers/evidenciaController');
const { verifyToken } = require('../middleware/authJwt');

// Rutas protegidas
router.post('/evidencias', verifyToken, evidenciaController.subirEvidencia);
router.get('/evidencias/tarea/:tarea_id', verifyToken, evidenciaController.listarEvidenciasPorTarea);

module.exports = router;