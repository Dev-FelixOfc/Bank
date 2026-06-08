const express = require('express');
const path = require('path');
const app = express();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const db = require('./database');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

app.get('/@:alias', (req, res) => {
    const aliasBuscar = req.params.alias;
    db.get(`SELECT username, alias, balance FROM usuarios WHERE alias = ? AND perfil_publico = 1`, [aliasBuscar], (err, user) => {
        if (err || !user) return res.status(404).send("Perfil privado o no encontrado.");
        res.send(`
            <div style="font-family: 'Segoe UI', sans-serif; text-align: center; padding: 50px; background: #f8f9fa; min-height: 100vh;">
                <div style="background: white; max-width: 400px; margin: auto; padding: 30px; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                    <div style="width: 80px; height: 80px; background: #6f42c1; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px; margin: 0 auto 20px auto; font-weight: bold;">${user.alias[0].toUpperCase()}</div>
                    <h2 style="color: #333; margin-bottom: 5px;">@${user.alias}</h2>
                    <p style="color: #666; margin-top: 0;">Usuario de Bank Kazuma</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 14px; color: #888; text-transform: uppercase; margin-bottom: 5px; letter-spacing: 1px;">Balance Virtual</p>
                    <h3 style="font-size: 36px; color: #6f42c1; margin: 0;">$${user.balance.toFixed(2)}</h3>
                </div>
            </div>
        `);
    });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server Kazuma: ${PORT}`));