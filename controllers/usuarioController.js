const jwt = require('jsonwebtoken');
const db = require('../db');
const bcrypt = require('bcryptjs');


exports.eliminarUsuario = (req, res) => {
    const { id } = req.params;

    // Obtener el cargo desde el token decodificado
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.cargo !== 'rector') {
            return res.status(403).json({ error: 'Acceso denegado. Solo el rector puede eliminar usuarios.' });
        }

        const sql = 'DELETE FROM Usuarios WHERE id = ?';

        db.query(sql, [id], (error, results) => {
            if (error) {
                console.error('Error al eliminar usuario:', error);
                return res.status(500).json({ error: 'Error al eliminar el usuario' });
            }

            if (results.affectedRows === 0) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }

            res.json({ message: 'Usuario eliminado exitosamente' });
        });
    } catch (error) {
        console.error('Error al verificar token:', error);
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
};


exports.crearUsuario = (req, res) => {
    const { nombre_completo, correo, contrasena, cargo } = req.body;

    // Validación de campos obligatorios
    if (!nombre_completo || !correo || !contrasena || !cargo) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    // Verificar si el correo ya existe
    const checkCorreo = 'SELECT * FROM Usuarios WHERE correo = ?';
    db.query(checkCorreo, [correo], async (error, results) => {
        if (error) {
            console.error('Error al verificar correo:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }

        if (results.length > 0) {
            return res.status(400).json({ error: 'El correo ya está registrado' });
        }

        try {
            // Encriptar contrasena
            const hashedPassword = await bcrypt.hash(contrasena, 10);

            const estado = 'activo';

            const sql = `
                INSERT INTO Usuarios 
                (nombre_completo, correo, contrasena, cargo, estado) 
                VALUES (?, ?, ?, ?, ?)
            `;

            db.query(sql, [nombre_completo, correo, hashedPassword, cargo, estado], (err, results) => {
                if (err) {
                    console.error('Error al insertar usuario:', err);
                    return res.status(500).json({ error: 'Error al crear el usuario' });
                }
                res.status(201).json({
                    message: 'Usuario creado exitosamente',
                    usuarioId: results.insertId
                });
            });

        } catch (error) {
            console.error('Error al encriptar contrasena:', error);
            res.status(500).json({ error: 'Error al procesar la contrasena' });
        }
    });
};

exports.listarUsuarios = (req, res) => {
    const { cargo } = req.query;
    let sql = 'SELECT `id`, `nombre_completo`, `correo`, `cargo`, `estado` FROM `Usuarios`';
    let params = [];

    if (cargo) {
        sql += ' WHERE cargo = ?';
        params.push(cargo);
    }

    db.query(sql, params, (error, results) => {
        if (error) {
            console.error('Error al obtener usuarios:', error);
            return res.status(500).json({ error: 'Error al obtener la lista de usuarios' });
        }
        res.json(results);
    });
};

exports.loginUsuario = (req, res) => {
    console.log("BODY:", req.body);

    
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
        return res.status(400).json({ error: 'Correo y contrasena son obligatorios' });
    }

    
    const sql = 'SELECT * FROM Usuarios WHERE correo = ?';
    db.query(sql, [correo], async (error, results) => {
        console.log("Resultados SQL:", results);
        if (error) {
            console.error('Error al buscar usuario:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }

        if (results.length === 0) {
            return res.status(401).json({ error: 'Correo o contrasena incorrectos' });
        }

        const usuario = results[0];
        console.log("Hash desde base de datos:", usuario["contrasena"]);
        console.log("contrasena escrita por el usuario:", contrasena);

        const validPassword = await bcrypt.compare(contrasena, usuario["contrasena"]);

        if (!validPassword) {
            return res.status(401).json({ error: 'Correo o contrasena incorrectos' });
        }

        // Generar token JWT
        const token = jwt.sign(
            {
                id: usuario.id,
                nombre_completo: usuario.nombre_completo,
                correo: usuario.correo,
                cargo: usuario.cargo
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' } // El token expira en 1 hora
        );


        // Enviar respuesta con token
        res.json({
            message: 'Inicio de sesión exitoso',
            token: token,
            usuario: {
                id: usuario.id,
                nombre_completo: usuario.nombre_completo,
                correo: usuario.correo,
                cargo: usuario.cargo
            }
        });
    });
};

exports.actualizarUsuario = async (req, res) => {
    const { id } = req.params;
    const { nombre_completo, correo, cargo, estado } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.cargo !== 'rector') {
            return res.status(403).json({ error: 'Acceso denegado. Solo el rector puede editar usuarios.' });
        }

        const sql = `
            UPDATE Usuarios
            SET nombre_completo = ?, correo = ?, cargo = ?, estado = ?
            WHERE id = ?
        `;

        db.query(sql, [nombre_completo, correo, cargo, estado, id], (error, results) => {
            if (error) {
                console.error('Error al actualizar usuario:', error);
                return res.status(500).json({ error: 'Error al actualizar el usuario' });
            }

            if (results.affectedRows === 0) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }

            res.json({ message: 'Usuario actualizado exitosamente' });
        });

    } catch (error) {
        console.error('Error al verificar token:', error);
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
};

// Obtener técnicos disponibles
exports.obtenerTecnicos = (req, res) => {
  const sql = `
    SELECT id, nombre_completo 
    FROM Usuarios 
    WHERE cargo = 'tecnico'
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error al obtener técnicos:", err);
      return res.status(500).json({ error: "Error interno al obtener técnicos" });
    }
    res.json(results);
  });
};


