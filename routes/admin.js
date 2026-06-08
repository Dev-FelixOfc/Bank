const express = require('express');
const router = express.Router();
const db = require('../database');
const { verificarToken, verificarAdmin } = require('../middleware/auth');

router.use(verificarToken, verificarAdmin);

router.get('/usuarios', (req, res) => {
    db.all(`SELECT id, username, alias, perfil_publico, rol, balance FROM usuarios`, [], (err, rows) => {
        res.json(rows);
    });
});

router.put('/usuarios/:id/balance', (req, res) => {
    const { operacion, monto } = req.body;
    const userId = req.params.id;

    if (operacion === 'DAR') {
        db.serialize(() => {
            db.run(`UPDATE usuarios SET balance = balance + ? WHERE id = ?`, [monto, userId]);
            db.run(`INSERT INTO transacciones (user_id, tipo, monto, descripcion) VALUES (?, 'ADMIN_DAR', ?, 'Ajuste admin')`, [userId, monto]);
        });
        res.json({ mensaje: "Balance increased" });
    } else if (operacion === 'QUITAR') {
        db.serialize(() => {
            db.run(`UPDATE usuarios SET balance = balance - ? WHERE id = ?`, [monto, userId]);
            db.run(`INSERT INTO transacciones (user_id, tipo, monto, descripcion) VALUES (?, 'ADMIN_QUITAR', ?, 'Ajuste admin')`, [userId, monto]);
        });
        res.json({ mensaje: "Balance decreased" });
    } else {
        res.status(400).json({ error: "Invalid action" });
    }
});

router.get('/usuarios/:id/tarjetas', (req, res) => {
    db.all(`SELECT * FROM tarjetas WHERE user_id = ?`, [req.params.id], (err, rows) => {
        res.json(rows);
    });
});

router.put('/tarjetas/:numero/estado', (req, res) => {
    const { activa } = req.body;
    db.run(`UPDATE tarjetas SET activa = ? WHERE numero_tarjeta = ?`, [activa, req.params.numero], function(err) {
        res.json({ mensaje: "Card status updated" });
    });
});

router.delete('/tarjetas/:numero', (req, res) => {
    db.run(`DELETE FROM tarjetas WHERE numero_tarjeta = ?`, [req.params.numero], function(err) {
        res.json({ mensaje: "Card deleted" });
    });
});

module.exports = router;