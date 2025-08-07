const db = require('../db');

// Crear nuevo mantenimiento preventivo
exports.crearMantenimiento = (req, res) => {
    const { tarea_nombre, descripcion, frecuencia_dias, area_responsable, responsable_id } = req.body;

    if (!tarea_nombre || !frecuencia_dias || !area_responsable) {
        return res.status(400).json({ error: 'Los campos obligatorios son: tarea_nombre, frecuencia_dias y area_responsable' });
    }

    const ahora = new Date();
    const proxima_ejecucion = new Date();
    proxima_ejecucion.setDate(ahora.getDate() + parseInt(frecuencia_dias));

    const sql = `
        INSERT INTO MantenimientosPreventivos 
        (tarea_nombre, descripcion, frecuencia_dias, ultima_ejecucion, proxima_ejecucion, area_responsable, responsable_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [
        tarea_nombre, 
        descripcion || null, 
        frecuencia_dias, 
        null, 
        proxima_ejecucion, 
        area_responsable, 
        responsable_id || null
    ], (error, result) => {
        if (error) {
            console.error('Error al crear mantenimiento:', error);
            return res.status(500).json({ error: 'Error al crear el mantenimiento preventivo' });
        }
        res.status(201).json({
            message: 'Mantenimiento preventivo creado exitosamente',
            mantenimientoId: result.insertId
        });
    });
};

// Listar todos los mantenimientos programados
exports.listarMantenimientos = (req, res) => {
    const sql = `
        SELECT 
            m.id,
            m.tarea_nombre,
            m.descripcion,
            m.frecuencia_dias,
            m.ultima_ejecucion,
            m.proxima_ejecucion,
            m.area_responsable,
            m.estado, -- ✅ Agregado este campo
            IFNULL(u.nombre_completo, 'No asignado') AS responsable
        FROM MantenimientosPreventivos m
        LEFT JOIN Usuarios u ON m.responsable_id = u.id
    `;

    db.query(sql, (error, results) => {
        if (error) {
            console.error('Error al obtener mantenimientos:', error);
            return res.status(500).json({ error: 'Error al obtener mantenimientos preventivos' });
        }
        res.json(results);
    });
};


// Obtener mantenimiento por ID
exports.obtenerMantenimientoPorId = (req, res) => {
    const { id } = req.params;

    const sql = `
        SELECT 
            m.id,
            m.tarea_nombre,
            m.descripcion,
            m.frecuencia_dias,
            m.ultima_ejecucion,
            m.proxima_ejecucion,
            m.area_responsable,
            IFNULL(u.nombre_completo, 'No asignado') AS responsable
        FROM MantenimientosPreventivos m
        LEFT JOIN Usuarios u ON m.responsable_id = u.id
        WHERE m.id = ?
    `;

    db.query(sql, [id], (error, results) => {
        if (error) {
            console.error('Error al obtener mantenimiento:', error);
            return res.status(500).json({ error: 'Error al obtener el mantenimiento' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Mantenimiento no encontrado' });
        }

        res.json(results[0]);
    });
};

// Actualizar última ejecución y calcular próxima
exports.marcarEjecutado = (req, res) => {
    const { id } = req.params;

    const sqlObtener = 'SELECT * FROM MantenimientosPreventivos WHERE id = ? AND estado = "activo"';
    db.query(sqlObtener, [id], (error, results) => {
        if (error) {
            console.error('Error al obtener mantenimiento:', error);
            return res.status(500).json({ error: 'Error al obtener mantenimiento' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Mantenimiento no encontrado o inactivo' });
        }

        const mantenimiento = results[0];
        const ultima_ejecucion = new Date();
        const proxima_ejecucion = new Date();
        proxima_ejecucion.setDate(ultima_ejecucion.getDate() + mantenimiento.frecuencia_dias);

        const sqlActualizar = `
            UPDATE MantenimientosPreventivos 
            SET ultima_ejecucion = ?, proxima_ejecucion = ? 
            WHERE id = ?
        `;

        db.query(sqlActualizar, [ultima_ejecucion, proxima_ejecucion, id], (err, result) => {
            if (err) {
                console.error('Error al actualizar ejecución:', err);
                return res.status(500).json({ error: 'Error al actualizar ejecución' });
            }

            res.json({
                message: 'Mantenimiento actualizado correctamente',
                ultima_ejecucion,
                proxima_ejecucion
            });
        });
    });
};

// Activar/desactivar mantenimiento
exports.actualizarEstado = (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;

    const sql = 'UPDATE MantenimientosPreventivos SET estado = ? WHERE id = ?';

    db.query(sql, [estado, id], (error, result) => {
        if (error) {
            console.error('Error al actualizar estado:', error);
            return res.status(500).json({ error: 'Error al actualizar estado' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Mantenimiento no encontrado' });
        }

        res.json({ message: `Mantenimiento ${estado} correctamente` });
    });
};