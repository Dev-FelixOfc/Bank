const express = require('express');
const router = express.Router();
const db = require('../database');
const { verificarToken } = require('../middleware/auth');

router.put('/privacidad', verificarToken, (req, res) => {
    const { perfil_publico, alias } = req.body;

    if (perfil_publico === 1) {
        if (!alias || alias.includes(" ")) {
            return res.status(400).json({ error: "Invalid alias" });
        }

        db.run(`UPDATE usuarios SET perfil_publico = 1, alias = ? WHERE id = ?`, [alias, req.userId], function(err) {
            if (err) return res.status(400).json({ error: "Alias taken" });
            res.json({ mensaje: "Profile public" });
        });
    } else {
        db.run(`UPDATE usuarios SET perfil_publico = 0 WHERE id = ?`, [req.userId], function(err) {
            res.json({ mensaje: "Profile private" });
        });
    }
});

router.get('/alias/:alias', (req, res) => {
    const aliasBuscar = req.params.alias;

    db.get(`SELECT username, alias, balance FROM usuarios WHERE alias = ? AND perfil_publico = 1`, [aliasBuscar], (err, user) => {
        if (err || !user) return res.status(404).json({ error: "Profile not found or private" });
        res.json(user);
    });
});

router.post('/tarjeta/crear', verificarToken, (req, res) => {
    const { pin } = req.body;
    const numero_tarjeta = Array.from({length: 16}, () => Math.floor(Math.random() * 10)).join('');

    db.run(`INSERT INTO tarjetas (user_id, numero_tarjeta, pin) VALUES (?, ?, ?)`, [req.userId, numero_tarjeta, pin], function(err) {
        if (err) return res.status(500).json({ error: "Card error" });
        res.status(201).json({ numero_tarjeta, pin });
    });
});

router.get('/balance', verificarToken, (req, res) => {
    db.get(`SELECT username, alias, perfil_publico, balance FROM usuarios WHERE id = ?`, [req.userId], (err, user) => {
        res.json(user);
    });
});

module.exports = router;