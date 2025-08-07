const db = require('../db');
const fs = require('fs');
const path = require('path');


// Carpeta donde se guardaran los archivos subidos
const UPLOADS_DIR = path.join(__dirname, '../uploads');


if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

//  Subir evidencia
exports.subirEvidencia = (req, res) => {
    const { tarea_id } = req.body;
    const uploaded_by = req.usuario.id;

    if (!req.files || !req.files.evidencia) {
        return res.status(400).json({ error: 'No se ha seleccionado ningun archivo' });
    }

    const file = req.files.evidencia;
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(UPLOADS_DIR, fileName);

    // Mover archivo al directorio de uploads
    file.mv(filePath, (err) => {
        if (err) {
            console.error('Error al mover archivo:', err);
            return res.status(500).json({ error: 'Error al guardar el archivo' });
        }

        const sql = `
            INSERT INTO Evidencias 
            (tarea_id, file_path, uploaded_by, uploaded_at) 
            VALUES (?, ?, ?, NOW())
        `;

        db.query(sql, [tarea_id, `/uploads/${fileName}`, uploaded_by], (error, result) => {
            if (error) {
                console.error('Error al registrar evidencia:', error);
                return res.status(500).json({ error: 'Error al registrar la evidencia' });
            }
            res.status(201).json({
                message: 'Evidencia cargada exitosamente',
                evidenciaId: result.insertId,
                url: `/uploads/${fileName}`
            });
        });
    });
};

//  Listar evidencias de una tarea
exports.listarEvidenciasPorTarea = (req, res) => {
    const { tarea_id } = req.params;

    const sql = `
        SELECT e.id, e.file_path, u.nombre_completo AS usuario, e.uploaded_at
        FROM Evidencias e
        JOIN Usuarios u ON e.uploaded_by = u.id
        WHERE e.tarea_id = ?
    `;

    db.query(sql, [tarea_id], (error, results) => {
        if (error) {
            console.error('Error al obtener evidencias:', error);
            return res.status(500).json({ error: 'Error al obtener evidencias' });
        }
        res.json(results);
    });
};