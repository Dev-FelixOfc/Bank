const express = require('express');
const router = express.Router();
const db = require('../database');
const { verificarToken } = require('../middleware/auth');

router.get('/me', verificarToken, (req, res) => {
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
            cardsCount: tarjetasUsuario.length
        });
    } catch (err) {
        res.status(500).json({ error: "Error en servidor: " + err.message });
    }
});

module.exports = router;