// routes/incidenciaRoutes.js

const express = require('express');
const router = express.Router();
const incidenciaController = require('../controllers/incidenciaController');
const { verifyToken, isSupervisor } = require('../middleware/authJwt');

// ✅ Permite a cualquier usuario autenticado crear una incidencia
router.post('/incidencias', verifyToken, incidenciaController.crearIncidencia);

// ✅ Listar incidencias (visible según permisos del frontend o controller)
router.get('/incidencias', verifyToken, incidenciaController.listarIncidencias);

// ✅ Obtener incidencia específica
router.get('/incidencias/:id', verifyToken, incidenciaController.obtenerIncidenciaPorId);

// ✅ Solo técnicos pueden actualizar incidencias
router.put('/incidencias/:id', verifyToken, incidenciaController.actualizarIncidencia);

// ✅ Solo supervisores pueden eliminar incidencias
router.delete('/incidencias/:id', verifyToken, isSupervisor, incidenciaController.eliminarIncidencia);

// ✅ Obtener ubicaciones para formulario de incidencias
router.get('/ubicaciones', verifyToken, incidenciaController.obtenerUbicaciones);

module.exports = router;
