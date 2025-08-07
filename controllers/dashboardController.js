const db = require('../db');

exports.getStats = (req, res) => {
    const stats = {};

    const queries = [
        {
            key: 'pendingTasks',
            sql: "SELECT COUNT(*) AS count FROM tareas WHERE estado = 'pendiente'"
        },
        {
            key: 'completedTasks',
            sql: "SELECT COUNT(*) AS count FROM tareas WHERE estado = 'completada'"
        },
        {
            key: 'activeUsers',
            sql: "SELECT COUNT(*) AS count FROM usuarios WHERE estado = 'activo'"
        },
        {
            key: 'openIncidents',
            sql: "SELECT COUNT(*) AS count FROM incidencias"
        }
    ];

    let completed = 0;

    queries.forEach(query => {
        db.query(query.sql, (err, results) => {
            if (err) {
                console.error(`Error fetching ${query.key}:`, err);
                return res.status(500).json({ error: `Error al obtener ${query.key}` });
            }

            stats[query.key] = results[0].count;
            completed++;

            if (completed === queries.length) {
                res.json(stats);
            }
        });
    });
};

exports.getRecentActivity = (req, res) => {
    const sql = `
        SELECT * FROM (
            SELECT 
                'Tarea' AS type,
                t.descripcion,
                t.fecha_asignacion AS created_at,
                u.nombre_completo AS usuario,
                CONCAT('Bloque ', ub.bloque, ' - Piso ', ub.piso, ' - ', ub.recurso) AS ubicacion,
                NULL AS tipo_dano,
                NULL AS prioridad
            FROM tareas t
            JOIN usuarios u ON t.tecnico_id = u.id
            JOIN incidencias i ON t.incidencia_id = i.id
            LEFT JOIN ubicaciones ub ON i.ubicacion_id = ub.id

            UNION ALL

            SELECT 
                'Incidencia' AS type,
                i.descripcion,
                i.fecha_reporte AS created_at,
                COALESCE(us.nombre_completo, 'Sistema') AS usuario,
                CONCAT('Bloque ', ub.bloque, ' - Piso ', ub.piso, ' - ', ub.recurso) AS ubicacion,
                i.tipo_dano,
                i.prioridad
            FROM incidencias i
            LEFT JOIN usuarios us ON i.reportado_por = us.id
            LEFT JOIN ubicaciones ub ON i.ubicacion_id = ub.id

            UNION ALL

            SELECT 
                'Evaluación' AS type,
                CONCAT('El supervisor ', sup.nombre_completo, ' evaluó al técnico ', tec.nombre_completo, ' y le dio una calificación de ', e.puntaje),
                e.fecha AS created_at,
                sup.nombre_completo AS usuario,
                NULL AS ubicacion,
                NULL AS tipo_dano,
                NULL AS prioridad
            FROM evaluaciones e
            JOIN usuarios sup ON e.supervisor_id = sup.id
            JOIN usuarios tec ON e.tecnico_id = tec.id
        ) AS actividad
        ORDER BY created_at DESC
        LIMIT 10;
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('❌ Error al obtener actividad reciente:', err.sqlMessage || err.message);
            return res.status(500).json({ error: 'Error al obtener actividad reciente' });
        }

        res.json(results);
    });
};






// ==================== NUEVAS FUNCIONES PARA GRÁFICAS ====================

// Gráfica de Tareas por Estado (Donut/Pie Chart)
exports.getTasksChart = (req, res) => {
    const sql = `
        SELECT 
            estado,
            COUNT(*) as cantidad,
            ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM tareas)), 1) as porcentaje
        FROM tareas 
        GROUP BY estado
        ORDER BY cantidad DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error al obtener gráfica de tareas:', err);
            return res.status(500).json({ error: 'Error al obtener datos de tareas' });
        }

        const chartData = results.map(row => ({
            name: row.estado.charAt(0).toUpperCase() + row.estado.slice(1),
            value: row.cantidad,
            percentage: row.porcentaje,
            color: getStatusColor(row.estado)
        }));

        res.json({
            type: 'donut',
            title: 'Distribución de Tareas por Estado',
            data: chartData,
            total: chartData.reduce((sum, item) => sum + item.value, 0)
        });
    });
};

// Gráfica de Actividad Mensual (Line Chart)
exports.getActivityChart = (req, res) => {
    const sql = `
        SELECT 
            DATE_FORMAT(fecha_asignacion, '%Y-%m') as mes,
            'Tareas' as tipo,
            COUNT(*) as cantidad
        FROM tareas 
        WHERE fecha_asignacion >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(fecha_asignacion, '%Y-%m')
        
        UNION ALL
        
        SELECT 
            DATE_FORMAT(fecha_reporte, '%Y-%m') as mes,
            'Incidencias' as tipo,
            COUNT(*) as cantidad
        FROM incidencias 
        WHERE fecha_reporte >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(fecha_reporte, '%Y-%m')
        
        ORDER BY mes ASC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error al obtener gráfica de actividad:', err);
            return res.status(500).json({ error: 'Error al obtener datos de actividad' });
        }

        // Procesar datos para el gráfico de líneas
        const processedData = processActivityData(results);

        res.json({
            type: 'line',
            title: 'Actividad Mensual (Últimos 6 Meses)',
            data: processedData.chartData,
            labels: processedData.months
        });
    });
};

// Gráfica de Usuarios por Rol (Bar Chart)
exports.getUsersChart = (req, res) => {
    const sql = `
        SELECT 
            rol,
            COUNT(*) as cantidad,
            SUM(CASE WHEN estado = 'activo' THEN 1 ELSE 0 END) as activos,
            SUM(CASE WHEN estado = 'inactivo' THEN 1 ELSE 0 END) as inactivos
        FROM usuarios 
        GROUP BY rol
        ORDER BY cantidad DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error al obtener gráfica de usuarios:', err);
            return res.status(500).json({ error: 'Error al obtener datos de usuarios' });
        }

        const chartData = results.map(row => ({
            name: row.rol.charAt(0).toUpperCase() + row.rol.slice(1),
            total: row.cantidad,
            activos: row.activos,
            inactivos: row.inactivos,
            color: getRoleColor(row.rol)
        }));

        res.json({
            type: 'bar',
            title: 'Usuarios por Rol y Estado',
            data: chartData
        });
    });
};

// Gráfica de Rendimiento Semanal (Area Chart)
exports.getPerformanceChart = (req, res) => {
    const sql = `
        SELECT 
            DAYNAME(fecha_completada) as dia,
            DAYOFWEEK(fecha_completada) as dia_num,
            COUNT(*) as tareas_completadas
        FROM tareas 
        WHERE estado = 'completada' 
        AND fecha_completada >= DATE_SUB(NOW(), INTERVAL 4 WEEK)
        GROUP BY DAYNAME(fecha_completada), DAYOFWEEK(fecha_completada)
        ORDER BY dia_num
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error al obtener gráfica de rendimiento:', err);
            return res.status(500).json({ error: 'Error al obtener datos de rendimiento' });
        }

        // Completar todos los días de la semana
        const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const chartData = daysOfWeek.map((day, index) => {
            const found = results.find(r => r.dia_num === index + 1);
            return {
                name: day,
                value: found ? found.tareas_completadas : 0
            };
        });

        res.json({
            type: 'area',
            title: 'Tareas Completadas por Día (Últimas 4 Semanas)',
            data: chartData
        });
    });
};

// Gráfica de Prioridades de Tareas (Horizontal Bar)
exports.getPriorityChart = (req, res) => {
    const sql = `
        SELECT 
            prioridad,
            COUNT(*) as total,
            SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
            SUM(CASE WHEN estado = 'en_progreso' THEN 1 ELSE 0 END) as en_progreso,
            SUM(CASE WHEN estado = 'completada' THEN 1 ELSE 0 END) as completadas
        FROM tareas 
        WHERE prioridad IS NOT NULL
        GROUP BY prioridad
        ORDER BY 
            CASE prioridad 
                WHEN 'alta' THEN 1 
                WHEN 'media' THEN 2 
                WHEN 'baja' THEN 3 
            END
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error al obtener gráfica de prioridades:', err);
            return res.status(500).json({ error: 'Error al obtener datos de prioridades' });
        }

        const chartData = results.map(row => ({
            name: row.prioridad.charAt(0).toUpperCase() + row.prioridad.slice(1),
            total: row.total,
            pendientes: row.pendientes,
            en_progreso: row.en_progreso,
            completadas: row.completadas,
            color: getPriorityColor(row.prioridad)
        }));

        res.json({
            type: 'horizontalBar',
            title: 'Tareas por Prioridad y Estado',
            data: chartData
        });
    });
};

// Endpoint para obtener todas las gráficas de una vez
exports.getAllCharts = async (req, res) => {
    try {
        const charts = {};

        // Ejecutar todas las consultas en paralelo
        const promises = [
            new Promise((resolve, reject) => {
                exports.getTasksChart(req, { json: resolve, status: () => ({ json: reject }) });
            }),
            new Promise((resolve, reject) => {
                exports.getActivityChart(req, { json: resolve, status: () => ({ json: reject }) });
            }),
            new Promise((resolve, reject) => {
                exports.getUsersChart(req, { json: resolve, status: () => ({ json: reject }) });
            }),
            new Promise((resolve, reject) => {
                exports.getPerformanceChart(req, { json: resolve, status: () => ({ json: reject }) });
            }),
            new Promise((resolve, reject) => {
                exports.getPriorityChart(req, { json: resolve, status: () => ({ json: reject }) });
            })
        ];

        const results = await Promise.all(promises);

        res.json({
            tasksChart: results[0],
            activityChart: results[1],
            usersChart: results[2],
            performanceChart: results[3],
            priorityChart: results[4]
        });

    } catch (error) {
        console.error('Error al obtener todas las gráficas:', error);
        res.status(500).json({ error: 'Error al obtener datos de gráficas' });
    }
};

// ==================== FUNCIONES AUXILIARES ====================

function getStatusColor(status) {
    const colors = {
        'pendiente': '#f59e0b',
        'en_progreso': '#3b82f6',
        'completada': '#10b981',
        'cancelada': '#ef4444'
    };
    return colors[status] || '#6b7280';
}

function getRoleColor(role) {
    const colors = {
        'rector': '#8b5cf6',
        'supervisor': '#06b6d4',
        'tecnico': '#84cc16'
    };
    return colors[role] || '#6b7280';
}

function getPriorityColor(priority) {
    const colors = {
        'alta': '#ef4444',
        'media': '#f59e0b',
        'baja': '#10b981'
    };
    return colors[priority] || '#6b7280';
}

function processActivityData(results) {
    // Obtener los últimos 6 meses
    const months = [];
    const currentDate = new Date();
    
    for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleString('es-ES', { month: 'short', year: '2-digit' });
        months.push({ key: monthKey, name: monthName });
    }

    // Procesar datos
    const chartData = months.map(month => {
        const tareas = results.find(r => r.mes === month.key && r.tipo === 'Tareas')?.cantidad || 0;
        const incidencias = results.find(r => r.mes === month.key && r.tipo === 'Incidencias')?.cantidad || 0;
        
        return {
            month: month.name,
            tareas: tareas,
            incidencias: incidencias,
            total: tareas + incidencias
        };
    });

    return {
        chartData,
        months: months.map(m => m.name)
    };
}