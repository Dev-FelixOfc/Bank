const express = require('express');
const app = express();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const db = require('./database');

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

app.get('/@:alias', (req, res) => {
    const aliasBuscar = req.params.alias;
    db.get(`SELECT username, alias, balance FROM usuarios WHERE alias = ? AND perfil_publico = 1`, [aliasBuscar], (err, user) => {
        if (err || !user) return res.status(404).send("Perfil privado o no encontrado.");
        res.send(`<h1>Perfil de ${user.alias}</h1><p>Balance en Bank Kazuma: $${user.balance}</p>`);
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server: ${PORT}`));