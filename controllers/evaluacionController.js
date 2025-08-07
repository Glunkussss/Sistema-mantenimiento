const db = require('../db');

//  Registrar una nueva evaluación
exports.crearEvaluacion = (req, res) => {
    const { tecnico_id, observaciones, puntaje } = req.body;
    const supervisor_id = req.usuario.id; // es quien realiza la evaluación

    if (!tecnico_id || !puntaje || puntaje < 1 || puntaje > 5) {
        return res.status(400).json({ 
            error: 'Técnico ID y puntaje entre 1.0 y 5.0 son obligatorios' 
        });
    }

    const sql = `
        INSERT INTO Evaluaciones 
        (tecnico_id, supervisor_id, observaciones, puntaje) 
        VALUES (?, ?, ?, ?)
    `;

    db.query(sql, [tecnico_id, supervisor_id, observaciones || null, puntaje], (error, result) => {
        if (error) {
            console.error('Error al crear evaluacion:', error);
            return res.status(500).json({ error: 'Error al registrar la evaluacion' });
        }
        res.status(201).json({
            message: 'Evaluacion registrada exitosamente',
            evaluacionId: result.insertId
        });
    });
};

// Listar todas las evaluaciones de un técnico
exports.listarEvaluacionesPorTecnico = (req, res) => {
    const { tecnico_id } = req.params;

    const sql = `
        SELECT 
            e.id,
            e.fecha,
            e.observaciones,
            e.puntaje,
            s.nombre_completo AS supervisor
        FROM Evaluaciones e
        JOIN Usuarios s ON e.supervisor_id = s.id
        WHERE e.tecnico_id = ?
        ORDER BY e.fecha DESC
    `;

    db.query(sql, [tecnico_id], (error, results) => {
        if (error) {
            console.error('Error al obtener evaluaciones:', error);
            return res.status(500).json({ error: 'Error al obtener evaluaciones' });
        }

        if (results.length === 0) {
            return res.json({ mensaje: 'No se encontraron evaluaciones para este tecnico' });
        }

        res.json(results);
    });
};

// Obtener promedio de puntaje de un tecnico
exports.obtenerPromedioPuntaje = (req, res) => {
    const { tecnico_id } = req.params;

    const sql = `
        SELECT 
            AVG(puntaje) AS promedio
        FROM Evaluaciones
        WHERE tecnico_id = ?
    `;

    db.query(sql, [tecnico_id], (error, results) => {
        if (error) {
            console.error('Error al calcular promedio:', error);
            return res.status(500).json({ error: 'Error al calcular promedio' });
        }

        const promedio = results[0].promedio ? parseFloat(results[0].promedio).toFixed(2) : 0;

        res.json({
            tecnico_id,
            promedio
        });
    });
};

// Eliminar una evaluacion 
exports.eliminarEvaluacion = (req, res) => {
    const { id } = req.params;

    const sql = 'DELETE FROM Evaluaciones WHERE id = ?';

    db.query(sql, [id], (error, result) => {
        if (error) {
            console.error('Error al eliminar evaluacion:', error);
            return res.status(500).json({ error: 'Error al eliminar la evaluacion' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Evaluacion no encontrada' });
        }

        res.json({ message: 'Evaluacion eliminada correctamente' });
    });
};