// routes/tareaRoutes.js

const express = require('express');
const router = express.Router();
const tareaController = require('../controllers/tareaController');
const { verifyToken, isSupervisor } = require('../middleware/authJwt');

// Rutas protegidas
router.post('/tareas', verifyToken, isSupervisor, tareaController.crearTarea);
router.get('/tareas', verifyToken, tareaController.listarTareas);
router.get('/tareas/:id', verifyToken, tareaController.obtenerTareaPorId);
router.put('/tareas/:id/estado', verifyToken, isSupervisor, tareaController.actualizarEstadoTarea);
router.put('/tareas/:id', verifyToken, isSupervisor, tareaController.editarTarea); // Editar tarea
router.delete('/tareas/:id', verifyToken, isSupervisor, tareaController.eliminarTarea);

// new
router.get('/tareas/historial', verifyToken, tareaController.listarHistorial);


module.exports = router;