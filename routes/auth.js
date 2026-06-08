const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { JWT_SECRET } = require('../middleware/auth');

router.post('/register', (req, res) => {
    const { username, email, password } = req.body;
    
    db.get(`SELECT id FROM usuarios WHERE username = ? OR email = ?`, [username, email], (err, row) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (row) return res.status(400).json({ error: "El usuario o correo ya se encuentra registrado" });

        const hashedPassword = bcrypt.hashSync(password, 8);
        db.run(`INSERT INTO usuarios (username, email, password) VALUES (?, ?, ?)`, [username, email, hashedPassword], function(insertErr) {
            if (insertErr) return res.status(400).json({ error: "Registration failed" });
            res.status(201).json({ mensaje: "Registered", userId: this.lastID });
        });
    });
});

router.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.get(`SELECT * FROM usuarios WHERE username = ?`, [username], (err, user) => {
        if (err || !user) return res.status(404).json({ error: "Not found" });

        const passwordValido = bcrypt.compareSync(password, user.password);
        if (!passwordValido) return res.status(401).json({ error: "Wrong password" });

        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '24h' });
        res.status(200).json({ id: user.id, username: user.username, rol: user.rol, token: token });
    });
});

module.exports = router;