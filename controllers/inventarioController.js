const db = require('../db');

// Registrar nueva herramienta o material
exports.crearRecurso = (req, res) => {
    const { nombre, tipo, cantidad_disponible, ubicacion_id, descripcion } = req.body;

    if (!nombre || !tipo || !cantidad_disponible || !ubicacion_id) {
        return res.status(400).json({ 
            error: 'Nombre, tipo, cantidad y ubicación son obligatorios' 
        });
    }

    const sql = `
        INSERT INTO Inventario 
        (nombre, tipo, cantidad_disponible, ubicacion_id, descripcion) 
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(sql, [nombre, tipo, cantidad_disponible, ubicacion_id, descripcion || null], (error, result) => {
        if (error) {
            console.error('Error al crear recurso:', error);
            return res.status(500).json({ error: 'Error al registrar el recurso' });
        }
        res.status(201).json({
            message: 'Recurso registrado exitosamente',
            recursoId: result.insertId
        });
    });
};

// Listar todos los recursos (filtrar por tipo si se desea)
exports.listarRecursos = (req, res) => {
    const { tipo } = req.query; // opcional

    let sql = `
        SELECT i.id, i.nombre, i.tipo, i.cantidad_disponible, i.ubicacion_id, 
               i.descripcion, u.nombre_ubicacion
        FROM Inventario i
        JOIN Ubicacion u ON i.ubicacion_id = u.id
    `;
    
    const params = [];

    if (tipo) {
        sql += ` WHERE i.tipo = ?`;
        params.push(tipo);
    }

    sql += ` ORDER BY i.nombre`;

    db.query(sql, params, (error, results) => {
        if (error) {
            console.error('Error al obtener recursos:', error);
            return res.status(500).json({ error: 'Error al obtener recursos' });
        }
        res.json(results);
    });
};

// Obtener un recurso específico por ID
exports.obtenerRecurso = (req, res) => {
    const { id } = req.params;

    const sql = `
        SELECT i.id, i.nombre, i.tipo, i.cantidad_disponible, i.ubicacion_id, 
               i.descripcion, u.nombre_ubicacion
        FROM Inventario i
        JOIN Ubicacion u ON i.ubicacion_id = u.id
        WHERE i.id = ?
    `;

    db.query(sql, [id], (error, results) => {
        if (error) {
            console.error('Error al obtener recurso:', error);
            return res.status(500).json({ error: 'Error al obtener recurso' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Recurso no encontrado' });
        }

        res.json(results[0]);
    });
};

// Actualizar recurso completo
exports.actualizarRecurso = (req, res) => {
    const { id } = req.params;
    const { nombre, tipo, cantidad_disponible, ubicacion_id, descripcion } = req.body;

    if (!nombre || !tipo || !cantidad_disponible || !ubicacion_id) {
        return res.status(400).json({ 
            error: 'Nombre, tipo, cantidad y ubicación son obligatorios' 
        });
    }

    const sql = `
        UPDATE Inventario 
        SET nombre = ?, tipo = ?, cantidad_disponible = ?, ubicacion_id = ?, descripcion = ?
        WHERE id = ?
    `;

    db.query(sql, [nombre, tipo, cantidad_disponible, ubicacion_id, descripcion || null, id], (error, result) => {
        if (error) {
            console.error('Error al actualizar recurso:', error);
            return res.status(500).json({ error: 'Error al actualizar recurso' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Recurso no encontrado' });
        }

        res.json({ message: 'Recurso actualizado correctamente' });
    });
};

// Actualizar cantidad disponible de un recurso (mantener compatibilidad)
exports.actualizarCantidad = (req, res) => {
    const { id } = req.params;
    const { cantidad_disponible } = req.body;

    const sql = 'UPDATE Inventario SET cantidad_disponible = ? WHERE id = ?';

    db.query(sql, [cantidad_disponible, id], (error, result) => {
        if (error) {
            console.error('Error al actualizar cantidad:', error);
            return res.status(500).json({ error: 'Error al actualizar cantidad' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Recurso no encontrado' });
        }

        res.json({ message: 'Cantidad actualizada correctamente' });
    });
};

// Eliminar recurso del inventario
exports.eliminarRecurso = (req, res) => {
    const { id } = req.params;

    const sql = 'DELETE FROM Inventario WHERE id = ?';

    db.query(sql, [id], (error, result) => {
        if (error) {
            console.error('Error al eliminar recurso:', error);
            return res.status(500).json({ error: 'Error al eliminar recurso' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Recurso no encontrado' });
        }

        res.json({ message: 'Recurso eliminado correctamente' });
    });
};