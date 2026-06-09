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

router.get('/me', middlewareLocal, (req, res) => {
    try {
        const datos = db.leerDatos();
        const user = datos.usuarios.find(u => u.id == req.userId);
        if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
        const tarjetasUsuario = datos.tarjetas ? datos.tarjetas.filter(t => t.user_id == user.id) : [];
        const balanceTotal = tarjetasUsuario.reduce((sum, t) => sum + (parseFloat(t.balance) || 0), 0);
        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            alias: user.alias,
            rol: user.rol,
            balance: balanceTotal,
            avatar: user.avatar || null,
            cardsCount: tarjetasUsuario.length,
            security_token: user.security_token || null
        });
    } catch (err) {
        res.status(500).json({ error: "Error en servidor: " + err.message });
    }
});

router.post('/profile/avatar', middlewareLocal, (req, res) => {
    try {
        const { avatar } = req.body;
        const datos = db.leerDatos();
        const userIndex = datos.usuarios.findIndex(u => u.id == req.userId);
        if (userIndex === -1) return res.status(404).json({ error: "Usuario no encontrado" });
        datos.usuarios[userIndex].avatar = avatar;
        db.guardarDatos(datos);
        res.json({ mensaje: "Avatar actualizado", avatar });
    } catch (err) {
        res.status(500).json({ error: "Error al guardar avatar: " + err.message });
    }
});

router.post('/profile/update', middlewareLocal, (req, res) => {
    try {
        const { username, email, alias } = req.body;
        const datos = db.leerDatos();
        const userIndex = datos.usuarios.findIndex(u => u.id == req.userId);
        if (userIndex === -1) return res.status(404).json({ error: "Usuario no encontrado" });
        const usuarioActual = datos.usuarios[userIndex];
        if (username && username.trim().toLowerCase() !== usuarioActual.username.toLowerCase()) {
            const userExiste = datos.usuarios.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
            if (userExiste) return res.status(400).json({ error: "El nombre de usuario ya esta en uso" });
            usuarioActual.username = username.trim();
        }
        if (email && email.trim().toLowerCase() !== (usuarioActual.email || '').toLowerCase()) {
            const emailExiste = datos.usuarios.find(u => (u.email || '').toLowerCase() === email.trim().toLowerCase());
            if (emailExiste) return res.status(400).json({ error: "El correo electronico ya esta registrado" });
        }
        if (alias && alias.trim().toLowerCase() !== (usuarioActual.alias || '').toLowerCase()) {
            const limpio = alias.trim();
            if (limpio.includes('@') || limpio.includes('#')) return res.status(400).json({ error: "El alias no puede contener @ ni #" });
            const aliasExiste = datos.usuarios.find(u => (u.alias || '').toLowerCase() === limpio.toLowerCase());
            if (aliasExiste) return res.status(400).json({ error: "El alias ya esta siendo utilizado" });
            usuarioActual.alias = limpio;
        } else if (alias === "") {
            usuarioActual.alias = null;
        }
        datos.usuarios[userIndex] = usuarioActual;
        db.guardarDatos(datos);
        res.json({ mensaje: "Perfil modificado correctamente" });
    } catch (err) {
        res.status(500).json({ error: "Error interno: " + err.message });
    }
});

router.post('/generate-security-token', middlewareLocal, (req, res) => {
    try {
        const datos = db.leerDatos();
        if (!datos.tokens_historico) datos.tokens_historico = [];
        const user = datos.usuarios.find(u => u.id == req.userId);
        if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
        const nuevoToken = crypto.createHash('sha256').update(Date.now() + Math.random().toString()).digest('hex');
        if (datos.tokens_historico.includes(nuevoToken)) return res.status(500).json({ error: "Error critico de colision" });
        user.security_token = nuevoToken;
        datos.tokens_historico.push(nuevoToken);
        db.guardarDatos(datos);
        res.json({ token: nuevoToken });
    } catch (err) {
        res.status(500).json({ error: "Error al generar token" });
    }
});

router.post('/transfer', (req, res) => {
    try {
        const { tokenEmisor, tokenReceptor, uidEmisor, uidReceptor, cantidad } = req.body;
        const monto = parseFloat(cantidad);
        if (!monto || monto <= 0) return res.status(400).json({ error: "Cantidad invalida" });
        const datos = db.leerDatos();
        const emisor = datos.usuarios.find(u => u.security_token === tokenEmisor);
        const receptor = datos.usuarios.find(u => u.security_token === tokenReceptor);
        if (!emisor || !receptor) return res.status(401).json({ error: "Token invalido" });
        const tarEmisor = datos.tarjetas.find(t => t.uid === uidEmisor && t.user_id === emisor.id);
        const tarReceptor = datos.tarjetas.find(t => t.uid === uidReceptor && t.user_id === receptor.id);
        if (!tarEmisor || !tarReceptor) return res.status(404).json({ error: "Tarjeta invalida o no pertenece al usuario" });
        if (parseFloat(tarEmisor.balance) < monto) return res.status(400).json({ error: "Fondos insuficientes" });
        tarEmisor.balance = parseFloat(tarEmisor.balance) - monto;
        tarReceptor.balance = parseFloat(tarReceptor.balance) + monto;
        db.guardarDatos(datos);
        res.json({ mensaje: "Transacción realizada exitosamente." });
    } catch (err) {
        res.status(500).json({ error: "Error interno: " + err.message });
    }
});

router.get('/public/card/balance/:uid', (req, res) => {
    try {
        const datos = db.leerDatos();
        const tarjeta = datos.tarjetas.find(t => t.uid === req.params.uid);
        if (!tarjeta) return res.status(404).json({ error: "Tarjeta no encontrada" });
        res.json({ uid: tarjeta.uid, balance: parseFloat(tarjeta.balance) });
    } catch (err) {
        res.status(500).json({ error: "Error en el servidor: " + err.message });
    }
});

module.exports = router;