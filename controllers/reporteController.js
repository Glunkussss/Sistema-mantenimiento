const db = require('../db');

exports.reporteGeneral = (req, res) => {
    const sql = `
        SELECT 
            COUNT(t.id) AS total_tareas,
            SUM(CASE WHEN t.estado = 'completada' THEN 1 ELSE 0 END) AS completadas,
            SUM(CASE WHEN t.estado = 'pendiente' THEN 1 ELSE 0 END) AS pendientes,
            SUM(CASE WHEN t.estado = 'en_progreso' THEN 1 ELSE 0 END) AS en_progreso,
            COUNT(DISTINCT t.tecnico_id) AS tecnicos_activos,
            COUNT(DISTINCT i.id) AS total_incidencias,
            ROUND(AVG(CASE WHEN t.estado = 'completada' THEN 
                TIMESTAMPDIFF(DAY, t.fecha_asignacion, t.fecha_fin) 
                ELSE NULL END), 1) AS promedio_dias_resolucion
        FROM tareas t
        LEFT JOIN incidencias i ON t.incidencia_id = i.id
    `;

    db.query(sql, (error, results) => {
        if (error) {
            console.error('Error al generar reporte:', error);
            return res.status(500).json({ error: 'Error al generar el reporte' });
        }
        res.json(results[0]);
    });
};

exports.reportePorTecnico = (req, res) => {
    const { tecnico_id } = req.params;

    const sql = `
        SELECT 
            u.nombre_completo AS tecnico,
            u.correo,
            COUNT(t.id) AS total_tareas,
            SUM(CASE WHEN t.estado = 'completada' THEN 1 ELSE 0 END) AS completadas,
            SUM(CASE WHEN t.estado = 'pendiente' THEN 1 ELSE 0 END) AS pendientes,
            SUM(CASE WHEN t.estado = 'en_progreso' THEN 1 ELSE 0 END) AS en_progreso,
            ROUND(AVG(CASE WHEN t.estado = 'completada' THEN 
                TIMESTAMPDIFF(DAY, t.fecha_asignacion, t.fecha_fin) 
                ELSE NULL END), 1) AS promedio_dias,
            ROUND((SUM(CASE WHEN t.estado = 'completada' THEN 1 ELSE 0 END) / COUNT(t.id)) * 100, 1) AS eficiencia,
            MAX(t.fecha_asignacion) AS ultima_tarea,
            COUNT(DISTINCT t.incidencia_id) AS incidencias_atendidas
        FROM usuarios u
        LEFT JOIN tareas t ON u.id = t.tecnico_id
        WHERE u.id = ? AND u.cargo = 'tecnico'
        GROUP BY u.id, u.nombre_completo, u.correo
    `;

    db.query(sql, [tecnico_id], (error, results) => {
        if (error) {
            console.error('Error al generar reporte:', error);
            return res.status(500).json({ error: 'Error al generar el reporte' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'No se encontraron datos para este técnico' });
        }

        res.json(results[0]);
    });
};

exports.estadisticasPorTipo = (req, res) => {
    const sql = `
        SELECT 
            i.tipo_dano AS tipo_incidencia,
            COUNT(i.id) AS cantidad,
            COUNT(t.id) AS tareas_generadas,
            SUM(CASE WHEN t.estado = 'completada' THEN 1 ELSE 0 END) AS tareas_completadas,
            i.prioridad,
            u.nombre_ubicacion AS ubicacion_comun
        FROM incidencias i
        LEFT JOIN tareas t ON i.id = t.incidencia_id
        LEFT JOIN ubicacion u ON i.ubicacion_id = u.id
        GROUP BY i.tipo_dano, i.prioridad, u.nombre_ubicacion
        ORDER BY cantidad DESC
    `;

    db.query(sql, (error, results) => {
        if (error) {
            console.error('Error al generar estadísticas:', error);
            return res.status(500).json({ error: 'Error al obtener estadísticas' });
        }
        res.json(results);
    });
};

exports.reportePorUbicacion = (req, res) => {
    const sql = `
        SELECT 
            u.nombre_ubicacion AS ubicacion,
            COUNT(DISTINCT i.id) AS total_incidencias,
            COUNT(DISTINCT t.id) AS total_tareas,
            SUM(CASE WHEN i.prioridad = 'alta' THEN 1 ELSE 0 END) AS incidencias_alta,
            SUM(CASE WHEN i.prioridad = 'media' THEN 1 ELSE 0 END) AS incidencias_media,
            SUM(CASE WHEN i.prioridad = 'baja' THEN 1 ELSE 0 END) AS incidencias_baja,
            COUNT(DISTINCT inv.id) AS items_inventario
        FROM ubicacion u
        LEFT JOIN incidencias i ON u.id = i.ubicacion_id
        LEFT JOIN tareas t ON i.id = t.incidencia_id
        LEFT JOIN inventario inv ON u.id = inv.ubicacion_id
        GROUP BY u.id, u.nombre_ubicacion
        HAVING total_incidencias > 0 OR items_inventario > 0
        ORDER BY total_incidencias DESC
    `;

    db.query(sql, (error, results) => {
        if (error) {
            console.error('Error al generar reporte por ubicación:', error);
            return res.status(500).json({ error: 'Error al obtener reporte por ubicación' });
        }
        console.log('Resultados ubicación:', results);
        res.json(results);
    });
};

exports.reporteInventario = (req, res) => {
    const sql = `
        SELECT 
            inv.tipo,
            COUNT(inv.id) AS total_items,
            SUM(inv.cantidad_disponible) AS cantidad_total,
            ROUND(AVG(inv.cantidad_disponible), 1) AS promedio_por_item,
            u.nombre_ubicacion AS ubicacion,
            COALESCE(COUNT(ti.id), 0) AS veces_utilizado
        FROM inventario inv
        LEFT JOIN ubicacion u ON inv.ubicacion_id = u.id
        LEFT JOIN tarea_inventario ti ON inv.id = ti.inventario_id
        WHERE inv.cantidad_disponible > 0
        GROUP BY inv.tipo, u.nombre_ubicacion
        ORDER BY total_items DESC
    `;

    db.query(sql, (error, results) => {
        if (error) {
            console.error('Error al generar reporte de inventario:', error);
            return res.status(500).json({ error: 'Error al obtener reporte de inventario' });
        }
        console.log('Resultados inventario:', results);
        res.json(results);
    });
};

exports.reporteEvaluaciones = (req, res) => {
    const sql = `
        SELECT 
            ut.nombre_completo AS tecnico,
            us.nombre_completo AS supervisor,
            AVG(e.puntaje) AS promedio_puntaje,
            COUNT(e.id) AS total_evaluaciones,
            MAX(e.fecha) AS ultima_evaluacion,
            MIN(e.fecha) AS primera_evaluacion
        FROM evaluaciones e
        JOIN usuarios ut ON e.tecnico_id = ut.id
        JOIN usuarios us ON e.supervisor_id = us.id
        GROUP BY ut.id, us.id, ut.nombre_completo, us.nombre_completo
        ORDER BY promedio_puntaje DESC
    `;

    db.query(sql, (error, results) => {
        if (error) {
            console.error('Error al generar reporte de evaluaciones:', error);
            return res.status(500).json({ error: 'Error al obtener reporte de evaluaciones' });
        }
        res.json(results);
    });
};

exports.dashboardStats = (req, res) => {
    const sql = `
        SELECT 
            (SELECT COUNT(*) FROM tareas WHERE estado = 'pendiente') AS pendingTasks,
            (SELECT COUNT(*) FROM tareas WHERE estado = 'completada') AS completedTasks,
            (SELECT COUNT(*) FROM usuarios WHERE estado = 'activo') AS activeUsers,
            (SELECT COUNT(*) FROM incidencias WHERE id NOT IN (
                SELECT DISTINCT incidencia_id FROM tareas WHERE estado = 'completada'
            )) AS openIncidents,
            (SELECT COUNT(*) FROM inventario) AS totalInventory,
            (SELECT COUNT(*) FROM evaluaciones WHERE fecha >= DATE_SUB(NOW(), INTERVAL 30 DAY)) AS recentEvaluations
    `;

    db.query(sql, (error, results) => {
        if (error) {
            console.error('Error al obtener estadísticas del dashboard:', error);
            return res.status(500).json({ error: 'Error al obtener estadísticas' });
        }
        res.json(results[0]);
    });
};

exports.actividadReciente = (req, res) => {
    const sql = `
        (
            SELECT 
                'tarea' AS type,
                t.descripcion AS descripcion,
                t.fecha_asignacion AS created_at,
                u.nombre_completo AS usuario,
                ub.recurso AS ubicacion,
                NULL AS tipo_dano,
                NULL AS prioridad
            FROM tareas t
            JOIN usuarios u ON t.tecnico_id = u.id
            LEFT JOIN ubicaciones ub ON t.ubicacion_id = ub.id
            ORDER BY t.fecha_asignacion DESC
            LIMIT 5
        )

        UNION ALL

        (
            SELECT 
                'incidencia' AS type,
                i.descripcion AS descripcion,
                i.fecha_reporte AS created_at,
                COALESCE(us.nombre_completo, 'Sistema') AS usuario,
                ub.recurso AS ubicacion,
                i.tipo_dano AS tipo_dano,
                i.prioridad AS prioridad
            FROM incidencias i
            LEFT JOIN usuarios us ON i.reportado_por = us.id
            LEFT JOIN ubicaciones ub ON i.ubicacion_id = ub.id
            ORDER BY i.fecha_reporte DESC
            LIMIT 5
        )

        UNION ALL

        (
            SELECT 
                'evaluacion' AS type,
                CONCAT('El supervisor ', sup.nombre_completo, ' evaluó al técnico ', tec.nombre_completo, ' y le dio una calificación de ', e.puntaje) AS descripcion,
                e.fecha AS created_at,
                sup.nombre_completo AS usuario,
                NULL AS ubicacion,
                NULL AS tipo_dano,
                NULL AS prioridad
            FROM evaluaciones e
            JOIN usuarios sup ON e.supervisor_id = sup.id
            JOIN usuarios tec ON e.tecnico_id = tec.id
            ORDER BY e.fecha DESC
            LIMIT 5
        )

        ORDER BY created_at DESC
        LIMIT 10;
    `;

    db.query(sql, (error, results) => {
        if (error) {
            console.error('Error al obtener actividad reciente:', error);
            return res.status(500).json({ error: 'Error al obtener actividad' });
        }
        res.json(results);
    });
};




// Agregar estos endpoints al reporteController.js para debugging

exports.testUbicaciones = (req, res) => {
    const sql = `SELECT u.id, u.nombre_ubicacion, 
                        (SELECT COUNT(*) FROM incidencias WHERE ubicacion_id = u.id) as incidencias,
                        (SELECT COUNT(*) FROM inventario WHERE ubicacion_id = u.id) as inventario
                 FROM ubicacion u`;
    
    db.query(sql, (error, results) => {
        if (error) {
            console.error('Error test ubicaciones:', error);
            return res.status(500).json({ error: error.message });
        }
        res.json(results);
    });
};

exports.testInventario = (req, res) => {
    const sql = `SELECT inv.*, u.nombre_ubicacion 
                 FROM inventario inv 
                 LEFT JOIN ubicacion u ON inv.ubicacion_id = u.id
                 ORDER BY inv.tipo, inv.cantidad_disponible DESC`;
    
    db.query(sql, (error, results) => {
        if (error) {
            console.error('Error test inventario:', error);
            return res.status(500).json({ error: error.message });
        }
        res.json(results);
    });
};

// Agregar estas rutas al reporteRoutes.js
// router.get('/test/ubicaciones', reporteController.testUbicaciones);
// router.get('/test/inventario', reporteController.testInventario;

// const db = require('../db');

// // Reporte general de productividad
// exports.reporteGeneral = (req, res) => {
//     const sql = `
//         SELECT 
//             COUNT(t.id) AS total_tareas,
//             SUM(CASE WHEN t.estado = 'completada' THEN 1 ELSE 0 END) AS completadas,
//             SUM(CASE WHEN t.estado = 'pendiente' THEN 1 ELSE 0 END) AS pendientes,
//             SUM(CASE WHEN t.estado = 'en_progreso' THEN 1 ELSE 0 END) AS en_progreso
//         FROM Tareas t
//     `;

//     db.query(sql, (error, results) => {
//         if (error) {
//             console.error('Error al generar reporte:', error);
//             return res.status(500).json({ error: 'Error al generar el reporte' });
//         }
//         res.json(results[0]);
//     });
// };

// // Reporte por técnico
// exports.reportePorTecnico = (req, res) => {
//     const { tecnico_id } = req.params;

//     const sql = `
//         SELECT 
//             u.nombre_completo AS tecnico,
//             COUNT(t.id) AS total_tareas,
//             SUM(CASE WHEN t.estado = 'completada' THEN 1 ELSE 0 END) AS completadas,
//             SUM(CASE WHEN t.estado = 'pendiente' THEN 1 ELSE 0 END) AS pendientes
//         FROM Tareas t
//         JOIN Usuarios u ON t.tecnico_id = u.id
//         WHERE t.tecnico_id = ?
//         GROUP BY t.tecnico_id
//     `;

//     db.query(sql, [tecnico_id], (error, results) => {
//         if (error) {
//             console.error('Error al generar reporte:', error);
//             return res.status(500).json({ error: 'Error al generar el reporte' });
//         }

//         if (results.length === 0) {
//             return res.status(404).json({ error: 'No se encontraron datos para este técnico' });
//         }

//         res.json(results[0]);
//     });
// };

// // Estadísticas por tipo de incidencia
// exports.estadisticasPorTipo = (req, res) => {
//     const sql = `
//         SELECT 
//             i.tipo_dano AS tipo_incidencia,
//             COUNT(i.id) AS cantidad
//         FROM Incidencias i
//         GROUP BY i.tipo_dano
//     `;

//     db.query(sql, (error, results) => {
//         if (error) {
//             console.error('Error al generar estadísticas:', error);
//             return res.status(500).json({ error: 'Error al obtener estadísticas' });
//         }
//         res.json(results);
//     });
// };
