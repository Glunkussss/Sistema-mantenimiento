const db = require('../db');

// Crear nueva solicitud
exports.crearSolicitud = (req, res) => {
    const { solicitante, descripcion, ubicacion_id, tipo_solicitud } = req.body;

    if (!solicitante || !descripcion || !ubicacion_id || !tipo_solicitud) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    const sql = `
        INSERT INTO SolicitudesInternas 
        (solicitante, descripcion, ubicacion_id, tipo_solicitud) 
        VALUES (?, ?, ?, ?)
    `;

    db.query(sql, [solicitante, descripcion, ubicacion_id, tipo_solicitud], (error, result) => {
        if (error) {
            console.error('Error al crear solicitud:', error);
            return res.status(500).json({ error: 'Error al crear la solicitud' });
        }
        res.status(201).json({
            message: 'Solicitud creada exitosamente',
            solicitudId: result.insertId
        });
    });
};

// Listar todas las solicitudes
exports.listarSolicitudes = (req, res) => {
    const sql = `
        SELECT 
            s.id, 
            s.solicitante, 
            s.descripcion, 
            u.nombre_ubicacion, 
            s.tipo_solicitud, 
            s.estado, 
            s.fecha_solicitud,
            IFNULL(us.nombre_completo, 'No asignado') AS tecnico_asignado
        FROM SolicitudesInternas s
        JOIN Ubicacion u ON s.ubicacion_id = u.id
        LEFT JOIN Usuarios us ON s.asignado_a = us.id
    `;

    db.query(sql, (error, results) => {
        if (error) {
            console.error('Error al obtener solicitudes:', error);
            return res.status(500).json({ error: 'Error al obtener solicitudes' });
        }
        res.json(results);
    });
};

// Obtener solicitud por ID
exports.obtenerSolicitudPorId = (req, res) => {
    const { id } = req.params;

    const sql = `
        SELECT 
            s.id, 
            s.solicitante, 
            s.descripcion, 
            u.nombre_ubicacion, 
            s.tipo_solicitud, 
            s.estado, 
            s.fecha_solicitud,
            IFNULL(us.nombre_completo, 'No asignado') AS tecnico_asignado
        FROM SolicitudesInternas s
        JOIN Ubicacion u ON s.ubicacion_id = u.id
        LEFT JOIN Usuarios us ON s.asignado_a = us.id
        WHERE s.id = ?
    `;

    db.query(sql, [id], (error, results) => {
        if (error) {
            console.error('Error al obtener solicitud:', error);
            return res.status(500).json({ error: 'Error al obtener la solicitud' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }

        res.json(results[0]);
    });
};

// Asignar solicitud a un técnico
exports.asignarTecnico = (req, res) => {
    const { id } = req.params;
    const { asignado_a } = req.body;

    const sql = 'UPDATE SolicitudesInternas SET asignado_a = ? WHERE id = ?';

    db.query(sql, [asignado_a, id], (error, result) => {
        if (error) {
            console.error('Error al asignar técnico:', error);
            return res.status(500).json({ error: 'Error al asignar técnico' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }

        res.json({ message: 'Técnico asignado correctamente' });
    });
};

// Actualizar estado de la solicitud
exports.actualizarEstadoSolicitud = (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;

    const sql = 'UPDATE SolicitudesInternas SET estado = ? WHERE id = ?';

    db.query(sql, [estado, id], (error, result) => {
        if (error) {
            console.error('Error al actualizar estado:', error);
            return res.status(500).json({ error: 'Error al actualizar estado' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }

        res.json({ message: 'Estado actualizado correctamente' });
    });
};