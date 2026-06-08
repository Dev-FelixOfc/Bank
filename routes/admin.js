const express = require('express');
const router = express.Router();
const db = require('../database');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'KazumaEcosystemSecretKey2026';

function middlewareAdminLocal(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'No token' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Format error' });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ error: 'Expired token' });
        
        const datos = db.leerDatos();
        const user = datos.usuarios.find(u => u.id === decoded.id);
        
        if (!user || user.rol !== 'admin') {
            return res.status(403).json({ error: 'Acceso denegado' });
        }
        
        req.userId = decoded.id;
        next();
    });
}

router.get('/users', middlewareAdminLocal, (req, res) => {
    try {
        const datos = db.leerDatos();
        res.json(datos.usuarios);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;