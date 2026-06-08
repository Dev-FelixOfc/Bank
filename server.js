const express = require('express');
const path = require('path');
const readline = require('readline');
const bcrypt = require('bcryptjs');
const app = express();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const db = require('./database');

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

app.get('/@:alias', (req, res) => {
    const aliasBuscar = req.params.alias;
    db.get(`SELECT username, alias, balance FROM usuarios WHERE alias = ? AND perfil_publico = 1`, [aliasBuscar], (err, user) => {
        if (err || !user) {
            return res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
        }
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

app.get('/dash', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dash.html'));
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
                        const hashedPassword = bcrypt.hashSync(password, 8);
                        db.run(
                            `INSERT INTO usuarios (username, email, password, rol) VALUES (?, ?, ?, 'admin')`,
                            [username, email, hashedPassword],
                            (err) => {
                                if (err) {
                                    console.log('Error: El usuario o correo ya existe en la Base de Datos.');
                                } else {
                                    console.log(`¡Exito! El administrador [${username}] ha sido creado correctamente.`);
                                }
                            }
                        );
                    });
                });
            });
        }
    });
}