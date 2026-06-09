const express = require('express');
const router = express.Router();
const db = require('../database');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'KazumaEcosystemSecretKey2026';
const PROTECTED_EMAIL = 'frasesbebor@gmail.com';

function middlewareAdminLocal(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'No token' });
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Format error' });
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ error: 'Expired token' });
        const datos = db.leerDatos();
        const user = datos.usuarios.find(u => u.id === decoded.id);
        if (!user || user.rol.toLowerCase() !== 'admin') {
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

router.post('/user/role', middlewareAdminLocal, (req, res) => {
    const { userId, newRole } = req.body;
    const datos = db.leerDatos();
    const user = datos.usuarios.find(u => u.id == userId);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
    if (user.email === PROTECTED_EMAIL) return res.status(403).json({ error: "Accion no permitida" });
    user.rol = newRole;
    db.guardarDatos(datos);
    res.json({ message: "Rol actualizado exitosamente" });
});

router.post('/card/balance', middlewareAdminLocal, (req, res) => {
    const { uid, amount } = req.body;
    const datos = db.leerDatos();
    const tarjeta = datos.tarjetas.find(t => t.uid === uid);
    if (!tarjeta) return res.status(404).json({ error: "Tarjeta no encontrada" });
    
    const balanceActual = parseFloat(tarjeta.balance) || 0;
    const montoCambio = parseFloat(amount);
    
    let nuevoBalance = balanceActual + montoCambio;
    
    if (nuevoBalance < 0) {
        nuevoBalance = 0;
    }
    
    tarjeta.balance = nuevoBalance;
    db.guardarDatos(datos);
    res.json({ message: "Balance actualizado exitosamente" });
});

router.delete('/card/:uid', middlewareAdminLocal, (req, res) => {
    const datos = db.leerDatos();
    const indice = datos.tarjetas.findIndex(t => t.uid === req.params.uid);
    if (indice === -1) return res.status(404).json({ error: "Tarjeta no encontrada" });
    datos.tarjetas.splice(indice, 1);
    db.guardarDatos(datos);
    res.json({ message: "Tarjeta eliminada exitosamente" });
});

module.exports = router;