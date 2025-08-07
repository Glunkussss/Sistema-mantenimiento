const db = require('../db');

// Crear nueva tarea
exports.crearTarea = (req, res) => {
    const { incidencia_id, tecnico_id, descripcion, tipo_dano } = req.body;
    const supervisor_id = req.usuario.id; // El usuario autenticado es quien asigna la tarea

    if (!incidencia_id || !tecnico_id || !descripcion || !tipo_dano) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    const fecha_asignacion = new Date();

    const sql = `
        INSERT INTO Tareas 
        (incidencia_id, supervisor_id, tecnico_id, descripcion, tipo_dano, estado, fecha_asignacion) 
        VALUES (?, ?, ?, ?, ?, 'pendiente', NOW())
    `;

    db.query(sql, [incidencia_id, supervisor_id, tecnico_id, descripcion, tipo_dano], (error, result) => {
        if (error) {
            console.error('Error al crear tarea:', error);
            return res.status(500).json({ error: 'Error al crear la tarea' });
        }
        res.status(201).json({
            message: 'Tarea creada exitosamente',
            tareaId: result.insertId
        });
    });
};

// Listar todas las tareas
exports.listarTareas = (req, res) => {
    const sql = `
        SELECT 
            t.id, 
            t.descripcion, 
            t.estado, 
            t.tipo_dano, 
            t.fecha_asignacion,
            u.nombre_completo AS tecnico,
            i.tipo_dano AS tipo_incidencia,
            i.ubicacion_id
        FROM Tareas t
        JOIN Usuarios u ON t.tecnico_id = u.id
        JOIN Incidencias i ON t.incidencia_id = i.id
    `;

    db.query(sql, (error, results) => {
        if (error) {
            console.error('Error al obtener tareas:', error);
            return res.status(500).json({ error: 'Error al obtener tareas' });
        }
        res.json(results);
    });
};

// Obtener tarea por ID
exports.obtenerTareaPorId = (req, res) => {
    const { id } = req.params;

    const sql = `
        SELECT 
            t.id, 
            t.descripcion, 
            t.estado, 
            t.tipo_dano, 
            t.fecha_asignacion,
            u.nombre_completo AS tecnico,
            i.tipo_dano AS tipo_incidencia,
            i.ubicacion_id
        FROM Tareas t
        JOIN Usuarios u ON t.tecnico_id = u.id
        JOIN Incidencias i ON t.incidencia_id = i.id
        WHERE t.id = ?
    `;

    db.query(sql, [id], (error, results) => {
        if (error) {
            console.error('Error al obtener tarea:', error);
            return res.status(500).json({ error: 'Error al obtener la tarea' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }

        res.json(results[0]);
    });
};

// Actualizar estado de la tarea
exports.actualizarEstadoTarea = (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;

    const sql = 'UPDATE Tareas SET estado = ? WHERE id = ?';

    db.query(sql, [estado, id], (error, result) => {
        if (error) {
            console.error('Error al actualizar estado de la tarea:', error);
            return res.status(500).json({ error: 'Error al actualizar estado' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }

        res.json({ message: 'Estado de la tarea actualizado correctamente' });
    });
};

// Eliminar tarea
exports.eliminarTarea = (req, res) => {
    const { id } = req.params;

    const sql = 'DELETE FROM Tareas WHERE id = ?';

    db.query(sql, [id], (error, result) => {
        if (error) {
            console.error('Error al eliminar tarea:', error);
            return res.status(500).json({ error: 'Error al eliminar la tarea' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }

        res.json({ message: 'Tarea eliminada correctamente' });
    });
};

exports.obtenerActividadReciente = (req, res) => {
    const sql = `
        SELECT * FROM (
            SELECT 
                'Incidencia' AS tipo,
                id,
                descripcion AS detalle,
                fecha_reporte AS fecha
            FROM incidencias
            
            UNION
            
            SELECT 
                'Tarea' AS tipo,
                id,
                descripcion AS detalle,
                fecha_asignacion AS fecha
            FROM tareas
            
            UNION
            
            SELECT 
                'Evaluación' AS tipo,
                id,
                CONCAT('Puntaje: ', puntaje, ' - ', observaciones) AS detalle,
                fecha AS fecha
            FROM evaluaciones
        ) AS actividades
        ORDER BY fecha DESC
        LIMIT 10
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('❌ Error al obtener actividad reciente:', err);
            return res.status(500).json({ error: 'Error al cargar actividad reciente' });
        }

        res.json(results);
    });
};

// Editar tarea
exports.editarTarea = (req, res) => {
    const { id } = req.params;
    const { incidencia_id, tecnico_id, descripcion, tipo_dano, prioridad } = req.body;

    if (!descripcion || !tipo_dano || !tecnico_id) {
        return res.status(400).json({ error: 'Campos requeridos faltantes' });
    }

    const sql = `
        UPDATE Tareas SET
            descripcion = ?,
            tipo_dano = ?,
            tecnico_id = ?,
            prioridad = ?,
            incidencia_id = ?
        WHERE id = ?
    `;

    db.query(sql, [descripcion, tipo_dano, tecnico_id, prioridad || 'media', incidencia_id || null, id], (error, result) => {
        if (error) {
            console.error('Error al actualizar tarea:', error);
            return res.status(500).json({ error: 'Error al actualizar tarea' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }

        res.json({ message: 'Tarea actualizada exitosamente' });
    });
};
