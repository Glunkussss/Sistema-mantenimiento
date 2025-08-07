const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
    const token = req.headers['x-access-token'] || req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ error: 'Token requerido' });
    }

    const tokenString = token.startsWith('Bearer ') ? token.slice(7, token.length) : token;

    try {
        const decoded = jwt.verify(tokenString, process.env.JWT_SECRET);
        req.usuario = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
};

// Middleware para verificar rol
exports.isSupervisor = (req, res, next) => {
    if (req.usuario.cargo !== 'supervisor') {
        return res.status(403).json({ error: 'Acceso denegado: se requiere rol de supervisor' });
    }
    next();
};

exports.isTecnico = (req, res, next) => {
    if (req.usuario.cargo !== 'tecnico') {
        return res.status(403).json({ error: 'Acceso denegado: se requiere rol de técnico' });
    }
    next();
};

exports.isRector = (req, res, next) => {
    if (req.usuario.cargo !== 'rector') {
        return res.status(403).json({ error: 'Acceso denegado: se requiere rol de rector' });
    }
    next();
};