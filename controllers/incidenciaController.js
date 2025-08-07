const db = require('../db');

// Crear una nueva incidencia
exports.crearIncidencia = (req, res) => {
    const { ubicacion_id, tipo_dano, prioridad, descripcion } = req.body;
    const reportado_por = req.usuario?.id || null;  // Este es el ID del usuario autenticado

    // Validación de campos obligatorios
    if (!ubicacion_id || !tipo_dano || !prioridad || !descripcion) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    // Unir múltiples daños si llegan como array
    const tipoDanoFinal = Array.isArray(tipo_dano) ? tipo_dano.join(', ') : tipo_dano;

    const sql = `
        INSERT INTO incidencias 
        (ubicacion_id, tipo_dano, prioridad, fecha_reporte, descripcion, reportado_por)
        VALUES (?, ?, ?, NOW(), ?, ?)
    `;

    db.query(sql, [ubicacion_id, tipoDanoFinal, prioridad, descripcion, reportado_por], (error, result) => {
        if (error) {
            console.error('Error al crear incidencia:', error);
            return res.status(500).json({ error: 'Error al crear la incidencia' });
        }

        res.status(201).json({
            message: 'Incidencia creada exitosamente',
            incidenciaId: result.insertId
        });
    });
};



// Listar todas las incidencias
exports.listarIncidencias = (req, res) => {
    const sql = `
        SELECT 
            i.id, 
            i.ubicacion_id,
            i.reportado_por,
            urep.nombre_completo AS nombre_reportado_por,
            CONCAT(ub.bloque, ' Piso ', ub.piso, ' - ', ub.recurso) AS nombre_ubicacion,
            i.tipo_dano,
            i.prioridad,
            i.fecha_reporte,
            i.descripcion
        FROM incidencias i
        JOIN ubicaciones ub ON i.ubicacion_id = ub.id
        LEFT JOIN usuarios urep ON i.reportado_por = urep.id
        ORDER BY i.fecha_reporte DESC
    `;

    db.query(sql, (error, results) => {
        if (error) {
            console.error('Error al obtener incidencias:', error);
            return res.status(500).json({ error: 'Error al obtener incidencias' });
        }
        res.json(results);
    });
};


// Obtener incidencia por ID
exports.obtenerIncidenciaPorId = (req, res) => {
    const { id } = req.params;

    const sql = `
        SELECT 
            i.id, 
            i.ubicacion_id,
            CONCAT(u.bloque, ' Piso ', u.piso, ' - ', u.recurso) AS nombre_ubicacion,
            i.tipo_dano,
            i.prioridad,
            i.fecha_reporte,
            i.descripcion
        FROM incidencias i
        JOIN ubicaciones u ON i.ubicacion_id = u.id
        WHERE i.id = ?
    `;

    db.query(sql, [id], (error, results) => {
        if (error) {
            console.error('Error al obtener incidencia:', error);
            return res.status(500).json({ error: 'Error al obtener la incidencia' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Incidencia no encontrada' });
        }

        res.json(results[0]);
    });
};

// Actualizar incidencia
exports.actualizarIncidencia = (req, res) => {
    const { id } = req.params;
    const { ubicacion_id, tipo_dano, prioridad, descripcion } = req.body;

    const sql = `
        UPDATE incidencias
        SET ubicacion_id = ?, tipo_dano = ?, prioridad = ?, descripcion = ?
        WHERE id = ?
    `;

    db.query(sql, [ubicacion_id, tipo_dano, prioridad, descripcion, id], (error, result) => {
        if (error) {
            console.error('Error al actualizar incidencia:', error);
            return res.status(500).json({ error: 'Error al actualizar la incidencia' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Incidencia no encontrada' });
        }

        res.json({ message: 'Incidencia actualizada correctamente' });
    });
};

// Eliminar incidencia
exports.eliminarIncidencia = (req, res) => {
    const { id } = req.params;

    const sql = 'DELETE FROM incidencias WHERE id = ?';

    db.query(sql, [id], (error, result) => {
        if (error) {
            console.error('Error al eliminar incidencia:', error);
            return res.status(500).json({ error: 'Error al eliminar la incidencia' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Incidencia no encontrada' });
        }

        res.json({ message: 'Incidencia eliminada correctamente' });
    });
};

// Obtener incidencias reportadas por el usuario
// exports.obtenerMisIncidencias = (req, res) => {
//     const usuario_id = req.usuario.id;

//     const sql = `
//         SELECT 
//             i.id, 
//             i.tipo_dano, 
//             i.prioridad, 
//             i.fecha_reporte,
//             i.descripcion,
//             CONCAT(u.bloque, ' Piso ', u.piso, ' - ', u.recurso) AS nombre_ubicacion
//         FROM incidencias i
//         JOIN ubicaciones u ON i.ubicacion_id = u.id
//         WHERE i.reportado_por = ?
//         ORDER BY i.fecha_reporte DESC
//     `;

//     db.query(sql, [usuario_id], (err, results) => {
//         if (err) {
//             console.error('Error al obtener incidencias del usuario:', err);
//             return res.status(500).json({ error: 'Error al obtener tus incidencias' });
//         }
//         res.json(results);
//     });
// };

// Obtener incidencias reportadas por el usuario
exports.obtenerMisIncidencias = (req, res) => {
    const usuario_id = req.usuario.id;

    const sql = `
    SELECT 
        i.id, 
        i.ubicacion_id,
        i.reportado_por, -- ✅ agrega este campo
        CONCAT(u.bloque, ' Piso ', u.piso, ' - ', u.recurso) AS nombre_ubicacion,
        i.tipo_dano,
        i.prioridad,
        i.fecha_reporte,
        i.descripcion
    FROM incidencias i
    JOIN ubicaciones u ON i.ubicacion_id = u.id
    WHERE i.id = ?
    `;

    db.query(sql, [usuario_id], (err, results) => {
        if (err) {
            console.error('Error al obtener incidencias del usuario:', err);
            return res.status(500).json({ error: 'Error al obtener tus incidencias' });
        }
        res.json(results);
    });
};


// Obtener todas las ubicaciones
exports.obtenerUbicaciones = (req, res) => {
    const sql = `
        SELECT id, bloque, piso, recurso, CONCAT(bloque, ' Piso ', piso, ' - ', recurso) AS nombre_ubicacion
        FROM ubicaciones
    `;

    db.query(sql, (error, results) => {
        if (error) {
            console.error('Error al obtener ubicaciones:', error);
            return res.status(500).json({ error: 'Error al obtener ubicaciones' });
        }

        res.json(results);
    });
};
