// routes/usuarioRoutes.js

const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { verifyToken } = require('../middleware/authJwt');

// Rutas públicas
router.post('/usuarios', usuarioController.crearUsuario);
router.post('/login', usuarioController.loginUsuario);
router.delete('/usuarios/:id', usuarioController.eliminarUsuario);

// Rutas protegidas
router.get('/usuarios', verifyToken, usuarioController.listarUsuarios);
router.put('/usuarios/:id', verifyToken, usuarioController.actualizarUsuario);

router.get('/tecnicos', verifyToken, usuarioController.obtenerTecnicos);


module.exports = router;