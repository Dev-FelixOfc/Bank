const express = require('express');
const path = require('path');
const readline = require('readline');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const app = express();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const cardsRoutes = require('./routes/cards');
const db = require('./database');

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.use((req, res, next) => {
    if (req.path.endsWith('.html')) {
        const nuevaRuta = req.path.slice(0, -5);
        return res.redirect(301, nuevaRuta);
    }
    next();
});

app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cards', cardsRoutes);

app.get('/api/public/profile/:alias', (req, res) => {
    try {
        const datos = db.leerDatos();
        const aliasBuscado = req.params.alias.toLowerCase();
        const user = datos.usuarios.find(u => u.alias && u.alias.toLowerCase() === aliasBuscado);
        if (!user) {
            return res.status(404).json({ error: "Este alias no pertenece a ningun miembro de Kazuma Ecosystem" });
        }
        const tarjetasUsuario = datos.tarjetas ? datos.tarjetas.filter(t => t.user_id == user.id) : [];
        const balanceTotal = tarjetasUsuario.reduce((sum, t) => sum + (parseFloat(t.balance) || 0), 0);
        res.json({
            username: user.username,
            alias: user.alias,
            balance: balanceTotal,
            avatar: user.avatar || null,
            cardsCount: tarjetasUsuario.length
        });
    } catch (err) {
        res.status(500).json({ error: "Error interno del servidor: " + err.message });
    }
});

app.get('/@:alias', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'user_preview.html'));
});

app.get('/dash', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dash.html'));
});

app.get('/cards', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'cards', 'index.html'));
});

app.get('/cards/create', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'cards', 'create.html'));
});

app.get('*', (req, res) => {
    const rutasPrincipales = ['/', '/login', '/signup'];
    if (rutasPrincipales.includes(req.path)) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
        res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server Kazuma operativo en puerto: ${PORT}`);
    iniciarConsolaInteractiva();
});

function iniciarConsolaInteractiva() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.on('line', (linea) => {
        if (linea.trim() === 'p:user/create') {
            rl.question('Ingrese Correo: ', (email) => {
                rl.question('Ingrese Usuario: ', (username) => {
                    rl.question('Ingrese Contrasena: ', (password) => {
                        try {
                            const datos = db.leerDatos();
                            const existeU = datos.usuarios.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
                            const existeE = datos.usuarios.find(u => u.email && u.email.toLowerCase() === email.trim().toLowerCase());
                            if (existeU || existeE) {
                                console.log('Error: El usuario o correo ya existe en la Base de Datos.');
                            } else {
                                const hashedPassword = bcrypt.hashSync(password, 8);
                                const nuevoAdmin = {
                                    id: Date.now(),
                                    username: username.trim(),
                                    email: email.trim(),
                                    password: hashedPassword,
                                    alias: null,
                                    perfil_publico: 0,
                                    rol: 'admin',
                                    balance: 0.0,
                                    avatar: null
                                };
                                datos.usuarios.push(nuevoAdmin);
                                db.guardarDatos(datos);
                                console.log(`¡Exito! El administrador [${username}] ha sido creado correctamente.`);
                            }
                        } catch (err) {
                            console.log('Error al procesar el archivo JSON en consola.');
                        }
                    });
                });
            });
        }
    });
}