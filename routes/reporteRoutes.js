// routes/reporteRoutes.js

const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporteController');


router.get('/dashboard/stats', reporteController.dashboardStats);
router.get('/dashboard/activity', reporteController.actividadReciente);
// DASHBOARD REPORTES

router.get('/reporte/general', reporteController.reporteGeneral);
router.get('/reporte/tecnico/:tecnico_id', reporteController.reportePorTecnico);
router.get('/reporte/tipo-incidencia', reporteController.estadisticasPorTipo);
router.get('/reporte/ubicacion', reporteController.reportePorUbicacion);
router.get('/reporte/inventario', reporteController.reporteInventario);
router.get('/reporte/evaluaciones', reporteController.reporteEvaluaciones);


module.exports = router;
