const db = require('../db');

// tareas pendientes o en progreso
exports.obtenerTareasPendientes = (req, res) => {
    const sql = `
        SELECT 
            t.id,
            t.descripcion,
            t.estado,
            t.fecha_limite,
            u.nombre_completo AS tecnico,
            TIMESTAMPDIFF(MINUTE, NOW(), t.fecha_limite) AS minutos_restantes
        FROM Tareas t
        JOIN Usuarios u ON t.tecnico_id = u.id
        WHERE t.estado IN ('pendiente', 'en_progreso')
    `;

    db.query(sql, (error, results) => {
        if (error) {
            console.error('Error al obtener tareas:', error);
            return res.status(500).json({ error: 'Error al obtener tareas' });
        }
        res.json(results);
    });
};

// Detectar tareas urgentes o vencidas
exports.verificarAlertas = (req, res) => {
    const sql = `
        SELECT 
            t.id,
            t.descripcion,
            t.estado,
            t.fecha_limite,
            u.nombre_completo AS tecnico,
            CASE
                WHEN t.fecha_limite < NOW() THEN 'vencida'
                WHEN TIMESTAMPDIFF(HOUR, NOW(), t.fecha_limite) <= 24 THEN 'urgente'
                ELSE 'normal'
            END AS nivel_alerta
        FROM Tareas t
        JOIN Usuarios u ON t.tecnico_id = u.id
        WHERE t.estado IN ('pendiente', 'en_progreso')
    `;

    db.query(sql, (error, results) => {
        if (error) {
            console.error('Error al verificar alertas:', error);
            return res.status(500).json({ error: 'Error al verificar alertas' });
        }
        res.json(results);
    });
};