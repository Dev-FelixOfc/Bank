const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { JWT_SECRET } = require('../middleware/auth');

router.post('/register', (req, res) => {
    try {
        const { username, email, password } = req.body;
        const datos = db.leerDatos();

        const usuarioExiste = datos.usuarios.find(u => u.username.toLowerCase() === username.toLowerCase());
        const emailExiste = datos.usuarios.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (usuarioExiste || emailExiste) {
            return res.status(400).json({ error: "El nombre de usuario o correo ya se encuentra registrado" });
        }

        const hashedPassword = bcrypt.hashSync(password, 8);
        
        const nuevoUsuario = {
            id: datos.usuarios.length > 0 ? datos.usuarios[datos.usuarios.length - 1].id + 1 : 1,
            username: username,
            email: email,
            password: hashedPassword,
            alias: null,
            perfil_publico: 0,
            rol: 'USER',
            balance: 0.0
        };

        datos.usuarios.push(nuevoUsuario);
        db.guardarDatos(datos);

        res.status(201).json({ mensaje: "Registered", userId: nuevoUsuario.id });
    } catch (err) {
        res.status(500).json({ error: "Error interno en JSON: " + err.message });
    }
});

router.post('/login', (req, res) => {
    try {
        const { username, password } = req.body;
        const datos = db.leerDatos();

        const user = datos.usuarios.find(u => u.username.toLowerCase() === username.toLowerCase());
        if (!user) {
            return res.status(444).json({ error: "Usuario no encontrado" });
        }

        const passwordValido = bcrypt.compareSync(password, user.password);
        if (!passwordValido) {
            return res.status(401).json({ error: "Contrasena incorrecta" });
        }

        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '24h' });
        res.status(200).json({ id: user.id, username: user.username, rol: user.rol, token: token });
    } catch (err) {
        res.status(500).json({ error: "Error en login JSON: " + err.message });
    }
});

module.exports = router;