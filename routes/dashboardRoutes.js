const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken } = require('../middleware/authJwt');

// Rutas existentes
router.get('/stats', verifyToken, dashboardController.getStats);
router.get('/activity', verifyToken, dashboardController.getRecentActivity);

// ==================== NUEVAS RUTAS PARA GRÁFICAS ====================

// Gráficas individuales
router.get('/charts/tasks', verifyToken, dashboardController.getTasksChart);
router.get('/charts/activity', verifyToken, dashboardController.getActivityChart);
router.get('/charts/users', verifyToken, dashboardController.getUsersChart);
router.get('/charts/performance', verifyToken, dashboardController.getPerformanceChart);
router.get('/charts/priority', verifyToken, dashboardController.getPriorityChart);

// Endpoint para obtener todas las gráficas
router.get('/charts/all', verifyToken, dashboardController.getAllCharts);

module.exports = router;