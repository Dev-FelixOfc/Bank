const express = require('express');
const router = express.Router();
const db = require('../database');
const jwt = require('jsonwebtoken');
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
        const user = datos.usuarios.find(u => u.id === req.userId);

        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        const tarjetasUsuario = datos.tarjetas ? datos.tarjetas.filter(t => t.user_id === user.id) : [];

        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            alias: user.alias,
            rol: user.rol,
            balance: user.balance,
            avatar: user.avatar || null,
            cardsCount: tarjetasUsuario.length
        });
    } catch (err) {
        res.status(500).json({ error: "Error en servidor: " + err.message });
    }
});

router.post('/profile/avatar', middlewareLocal, (req, res) => {
    try {
        const { avatar } = req.body;
        const datos = db.leerDatos();
        const userIndex = datos.usuarios.findIndex(u => u.id === req.userId);

        if (userIndex === -1) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

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
        
        const userIndex = datos.usuarios.findIndex(u => u.id === req.userId);
        if (userIndex === -1) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        const usuarioActual = datos.usuarios[userIndex];

        if (username && username.trim().toLowerCase() !== usuarioActual.username.toLowerCase()) {
            const userExiste = datos.usuarios.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
            if (userExiste) return res.status(400).json({ error: "El nombre de usuario ya esta en uso" });
            usuarioActual.username = username.trim();
        }

        if (email && email.trim().toLowerCase() !== (usuarioActual.email || '').toLowerCase()) {
            const emailExiste = datos.usuarios.find(u => (u.email || '').toLowerCase() === email.trim().toLowerCase());
            if (emailExiste) return res.status(400).json({ error: "El correo electronico ya esta registrado" });
            usuarioActual.email = email.trim();
        }

        if (alias && alias.trim().toLowerCase() !== (usuarioActual.alias || '').toLowerCase()) {
            const limpio = alias.trim();
            if (limpio.includes('@') || limpio.includes('#')) {
                return res.status(400).json({ error: "El alias no puede contener @ ni #" });
            }
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

module.exports = router;