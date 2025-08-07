// === Dependencias ===
const express = require('express');
const mysql = require('mysql2');
const dotenv = require('dotenv');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const path = require('path');
const schedule = require('node-schedule');

dotenv.config();

// === Inicialización ===
const app = express();
const PORT = process.env.PORT || 4000;

// === Middleware global ===
app.use(express.json());
app.use(cors());
app.use(fileUpload());
app.use(express.static(path.join(__dirname, 'frontend')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// === Conexión a la base de datos ===
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
});

db.connect((err) => {
    if (err) {
        console.error('❌ Error conectando a la BD:', err.code === 'ER_BAD_DB_ERROR'
            ? `La base de datos no existe: ${process.env.DB_NAME}`
            : err);
        process.exit(1);
    } else {
        console.log('✅ Conectado a la BD MySQL');
    }
});

// === Ruta base ===
app.get('/', (req, res) => {
    res.json({ message: 'Servidor corriendo en http://localhost:4000/login.html' });
});

// === Rutas del sistema ===
const routes = [
    'usuarioRoutes',
    'incidenciaRoutes',
    'tareaRoutes',
    'evidenciaRoutes',
    'alertaRoutes',
    'reporteRoutes',
    'solicitudRoutes',
    'mantenimientoRoutes',
    'evaluacionRoutes',
    'inventarioRoutes',
];

routes.forEach(route => {
    app.use('/api', require(`./routes/${route}`));
});

// === Tareas programadas ===

// Mantenimientos preventivos
// schedule.scheduleJob('0 0 8 * * *', () => {
//     const hoy = new Date();

//     const sql = `
//         SELECT 
//             m.id,
//             m.nombre_tarea,
//             m.proxima_ejecucion,
//             u.nombre_completo AS responsable
//         FROM MantenimientosPreventivos m
//         LEFT JOIN Usuarios u ON m.responsable_id = u.id
//         WHERE m.estado = 'activo'
//     `;

//     db.query(sql, (error, results) => {
//         if (error) {
//             console.error('❌ Error al verificar mantenimientos:', error);
//             return;
//         }

//         results.forEach((mant) => {
//             const diasRestantes = Math.ceil((new Date(mant.proxima_ejecucion) - hoy) / (1000 * 60 * 60 * 24));

//             if (diasRestantes <= 3 && diasRestantes > 0) {
//                 console.log(`⚠️ Próximo mantenimiento: ${mant.nombre_tarea} - Faltan ${diasRestantes} días`);
//             } else if (diasRestantes <= 0) {
//                 console.log(`🔴 Mantenimiento vencido: ${mant.nombre_tarea} - Debió realizarse el ${mant.proxima_ejecucion}`);
//             }
//         });
//     });
// });

schedule.scheduleJob('0 0 8 1 * *', () => {
  console.log('📅 Generando mantenimientos mensuales desde ubicaciones...');

  const sqlUbicaciones = `SELECT id, bloque, salon FROM ubicaciones`;

  db.query(sqlUbicaciones, (error, ubicaciones) => {
    if (error) {
      console.error('❌ Error al consultar ubicaciones:', error);
      return;
    }

    if (!ubicaciones || ubicaciones.length === 0) {
      console.log('⚠️ No se encontraron ubicaciones. Proceso detenido.');
      return;
    }

    const hoy = new Date();
    const proxima = new Date(hoy);
    proxima.setDate(proxima.getDate() + 30);

    const sqlInsert = `
      INSERT INTO MantenimientosPreventivos 
      (tarea_nombre, descripcion, frecuencia_dias, ultima_ejecucion, proxima_ejecucion, area_responsable)
      VALUES (?, ?, ?, NULL, ?, ?)
    `;

    ubicaciones.forEach(({ bloque, salon }) => {
      const nombre = `Mantenimiento Bloque ${bloque} - Salón ${salon}`;
      const descripcion = `Revisión mensual en el bloque ${bloque}, salón ${salon}`;
      const frecuencia = 30;
      const proximaEjecucion = proxima.toISOString().slice(0, 19).replace('T', ' ');
      const area = 'Mantenimiento'; // Puedes adaptar esto según tus reglas

      db.query(sqlInsert, [nombre, descripcion, frecuencia, proximaEjecucion, area], (err) => {
        if (err) {
          console.error(`❌ Error al crear mantenimiento para ${nombre}:`, err);
        } else {
          console.log(`✅ Mantenimiento generado: ${nombre}`);
        }
      });
    });
  });
});

// Verificación de tareas urgentes y vencidas
schedule.scheduleJob('0 0 8 * * *', () => {
    const sql = `
        SELECT 
            t.id,
            t.descripcion,
            t.estado,
            t.fecha_limite,
            u.nombre_completo AS tecnico,
            u.correo AS correo_tecnico,
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
            console.error('❌ Error al verificar alertas de tareas:', error);
            return;
        }

        const alertasUrgentes = results.filter(t => t.nivel_alerta === 'urgente');
        const alertasVencidas = results.filter(t => t.nivel_alerta === 'vencida');

        console.log('🚨 Tareas Urgentes:', alertasUrgentes);
        console.log('⏰ Tareas Vencidas:', alertasVencidas);
    });
});

// === Inicialización del servidor ===
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}/login.html`);
});

// === Exportaciones ===
module.exports = { app, db };


