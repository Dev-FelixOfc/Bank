const express = require('express');
const path = require('path');
const cors = require('cors');
const db = require('./database');
const usersRouter = require('./routes/users');

const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/users', usersRouter);

app.get('/api/public/profile/:alias', (req, res) => {
    try {
        const datos = db.leerDatos();
        const aliasBuscado = req.params.alias.toLowerCase();
        
        const user = datos.usuarios.find(u => u.alias && u.alias.toLowerCase() === aliasBuscado);
        
        if (!user) {
            return res.status(404).json({ error: "Este alias no pertenece a ningun miembro de Kazuma Ecosystem" });
        }

        const totalTarjetas = datos.tarjetas ? datos.tarjetas.filter(t => t.user_id === user.id).length : 0;

        res.json({
            username: user.username,
            alias: user.alias,
            balance: user.balance || 0,
            avatar: user.avatar || null,
            cardsCount: totalTarjetas
        });
    } catch (err) {
        res.status(500).json({ error: "Error interno del servidor: " + err.message });
    }
});

app.get('/@:alias', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'user_preview.html'));
});

app.get('/dash', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('*', (req, res) => {
    res.redirect('/login');
});

app.listen(PORT, () => {
    console.log('Server Kazuma operativo en puerto: ' + PORT);
});