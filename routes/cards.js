const express = require('express');
const router = express.Router();
const db = require('../database');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const JWT_SECRET = 'KazumaEcosystemSecretKey2026';

function middlewareLocal(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'No token' });
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Format error' });
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ error: 'Expired token' });
        req.userId = decoded.id;
        next();
    });
}

router.post('/new', middlewareLocal, (req, res) => {
    try {
        const { nunca_vence, fecha_vence, avatar_tarjeta } = req.body;
        const datos = db.leerDatos();

        const usuario = datos.usuarios.find(u => u.id == req.userId);
        if (!usuario) {
            return res.status(404).json({ error: "Usuario no encontrado en el ecosistema" });
        }

        if (!datos.tarjetas) {
            datos.tarjetas = [];
        }

        const apiKeyRandom = "KZM-" + crypto.randomBytes(8).toString('hex').toUpperCase();

        const tresNumeros = Math.floor(100 + Math.random() * 900).toString();
        const uidTarjeta = `224-${tresNumeros}`;

        const nuevaTarjeta = {
            id: Date.now().toString(),
            user_id: usuario.id,
            username_dueno: usuario.username,
            card_number: apiKeyRandom,
            uid: uidTarjeta,
            fecha_vencimiento: nunca_vence ? "NUNCA" : fecha_vence,
            avatar: avatar_tarjeta || usuario.avatar || null,
            color: "gold"
        };

        datos.tarjetas.push(nuevaTarjeta);
        db.guardarDatos(datos);

        res.json({ mensaje: "Tarjeta generada correctamente", tarjeta: nuevaTarjeta });
    } catch (err) {
        res.status(500).json({ error: "Error del servidor al crear tarjeta: " + err.message });
    }
});

module.exports = router;