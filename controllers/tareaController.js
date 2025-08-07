const db = require('../db');

// Crear tarea
exports.crearTarea = (req, res) => {
    const { incidencia_id, tecnico_id, supervisor_id, reportado_por, fecha_limite, descripcion, fallas_reportadas } = req.body;

    const sql = `
        INSERT INTO tareas (
            incidencia_id,
            tecnico_id,
            supervisor_id,
            reportado_por,
            fecha_limite,
            descripcion,
            fallas_reportadas
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [
        incidencia_id,
        tecnico_id,
        supervisor_id,
        reportado_por,
        fecha_limite,
        descripcion,
        fallas_reportadas
    ], (err, result) => {
        if (err) {
            console.error("Error al crear tarea:", err);
            return res.status(500).json({ error: "Error al crear tarea" });
        }

        res.status(201).json({ message: "Tarea creada exitosamente", tareaId: result.insertId });
    });
};


// Listar tareas

exports.listarTareas = async (req, res) => {
    try {
        const query = `
            SELECT 
                t.id,
                t.estado,
                t.fecha_limite,
                t.fecha_asignacion,  -- ✅ AÑADIDA
                t.descripcion,
                t.fallas_reportadas,
                COALESCE(t.prioridad, 'media') AS prioridad,
                t.tecnico_id,
                COALESCE(i.tipo_dano, 'No especificado') AS tipo_dano,
                COALESCE(u.nombre_completo, 'Sin técnico') AS tecnico_nombre,
                COALESCE(CONCAT(ub.bloque, ' Piso ', ub.piso, ' - ', ub.recurso), 'Sin ubicación') AS ubicacion_nombre
            FROM tareas t
            JOIN incidencias i ON t.incidencia_id = i.id
            JOIN ubicaciones ub ON i.ubicacion_id = ub.id
            LEFT JOIN usuarios u ON t.tecnico_id = u.id
        `;

        db.query(query, (err, results) => {
            if (err) {
                console.error('Error al obtener tareas:', err);
                return res.status(500).json({ error: 'Error al obtener tareas' });
            }
            res.json(results);
        });
    } catch (error) {
        console.error('Error inesperado en listarTareas:', error);
        res.status(500).json({ error: 'Error inesperado' });
    }
};


// Listar historial de tareas finalizadas
exports.listarHistorial = (req, res) => {
    const tecnicoId = req.query.tecnico_id;

    let sql = `
        SELECT 
            t.id,
            t.estado,
            t.fecha_limite,
            t.descripcion,
            t.fallas_reportadas,
            COALESCE(t.prioridad, 'media') AS prioridad,
            t.tecnico_id,
            COALESCE(i.tipo_dano, 'No especificado') AS tipo_dano,
            COALESCE(u.nombre_completo, 'Sin técnico') AS tecnico_nombre,
            COALESCE(CONCAT(ub.bloque, ' Piso ', ub.piso, ' - ', ub.recurso), 'Sin ubicación') AS ubicacion_nombre
        FROM tareas t
        JOIN incidencias i ON t.incidencia_id = i.id
        JOIN ubicaciones ub ON i.ubicacion_id = ub.id
        LEFT JOIN usuarios u ON t.tecnico_id = u.id
        WHERE t.estado = 'finalizada'
    `;

    const params = [];

    if (tecnicoId) {
        sql += ` AND t.tecnico_id = ?`;
        params.push(tecnicoId);
    }

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error('Error al obtener historial de tareas:', err);
            return res.status(500).json({ error: 'Error al obtener historial' });
        }

        res.json(results);
    });
};


// WORKING


// Obtener tarea por ID
exports.obtenerTareaPorId = (req, res) => {
    const { id } = req.params;
    const sql = `
        SELECT 
            t.*, 
            u.nombre_completo AS tecnico,
            r.nombre_completo AS reportado_por,
            CONCAT(ub.bloque, ' Piso ', ub.piso, ' - ', ub.recurso) AS ubicacion
        FROM tareas t
        JOIN usuarios u ON t.tecnico_id = u.id
        JOIN usuarios r ON t.reportado_por = r.id
        JOIN ubicaciones ub ON t.ubicacion_id = ub.id
        WHERE t.id = ?
    `;
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error al obtener la tarea' });
        if (result.length === 0) return res.status(404).json({ error: 'Tarea no encontrada' });
        res.json(result[0]);
    });
};

// Actualizar estado
exports.actualizarEstadoTarea = (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;
    const sql = 'UPDATE tareas SET estado = ? WHERE id = ?';

    db.query(sql, [estado, id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error al actualizar estado' });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Tarea no encontrada' });
        res.json({ message: 'Estado actualizado' });
    });
};

// Eliminar tarea
exports.eliminarTarea = (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM tareas WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error al eliminar' });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Tarea no encontrada' });
        res.json({ message: 'Tarea eliminada' });
    });
};

// Editar tarea
exports.editarTarea = (req, res) => {
    const { id } = req.params;
    const { tecnico_id, descripcion, fecha_limite, fallas_reportadas } = req.body;

    const sql = `
        UPDATE tareas SET
            tecnico_id = ?,
            descripcion = ?,
            fecha_limite = ?,
            fallas_reportadas = ?
        WHERE id = ?
    `;

    db.query(sql, [tecnico_id, descripcion, fecha_limite, fallas_reportadas || null, id], (err, result) => {
        if (err) return res.status(500).json({ error: 'No se pudo actualizar la tarea' });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Tarea no encontrada' });
        res.json({ message: 'Tarea actualizada' });
    });
};
