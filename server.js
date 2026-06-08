const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./database');

const app = express();
app.use(express.json());

const JWT_SECRET = "Tu_Clave_Secreta_Super_Segura_Cambia_Esto";

// --- MIDDLEWARE DE AUTENTICACIÓN ---
const verificarToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ error: "No se proporcionó un token." });
    
    jwt.verify(token.split(" ")[1], JWT_SECRET, (err, decoded) => {
        if (err) return res.status(500).json({ error: "Fallo al autenticar el token." });
        req.userId = decoded.id;
        next();
    });
};

// --- RUTAS DE USUARIO ---

// Registro de usuarios
app.post('/api/auth/register', (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 8);

    db.run(`INSERT INTO usuarios (username, password) VALUES (?, ?)`, [username, hashedPassword], function(err) {
        if (err) return res.status(400).json({ error: "El usuario ya existe." });
        res.status(201).json({ mensaje: "Usuario registrado con éxito.", userId: this.lastID });
    });
});

// Login
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;

    db.get(`SELECT * FROM usuarios WHERE username = ?`, [username], (err, user) => {
        if (err || !user) return res.status(404).json({ error: "Usuario no encontrado." });
        
        const passwordValido = bcrypt.compareSync(password, user.password);
        if (!passwordValido) return res.status(401).json({ token: null, error: "Contraseña incorrecta." });

        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '24h' });
        res.status(200).json({ id: user.id, username: user.username, token: token });
    });
});

// --- RUTAS DEL BANCO VIRTUAL ---

// Crear una nueva Tarjeta Virtual para el usuario
app.post('/api/tarjeta/crear', verificarToken, (req, res) => {
    const { pin } = req.body;
    // Generar un número de tarjeta aleatorio de 16 dígitos
    const numero_tarjeta = Array.from({length: 16}, () => Math.floor(Math.random() * 10)).join('');

    db.run(`INSERT INTO tarjetas (user_id, numero_tarjeta, pin) VALUES (?, ?, ?)`, 
    [req.userId, numero_tarjeta, pin], function(err) {
        if (err) return res.status(500).json({ error: "Error al generar la tarjeta." });
        res.status(201).json({ mensaje: "Tarjeta creada.", numero_tarjeta, pin });
    });
});

// Agregar dinero (Ruta Administrativa / Para tus bots de misiones)
// NOTA: En producción, protege esta ruta con una API KEY secreta que solo tus plataformas conozcan
app.post('/api/admin/recargar', (req, res) => {
    const { numero_tarjeta, monto, descripcion } = req.body;

    db.get(`SELECT user_id FROM tarjetas WHERE numero_tarjeta = ? AND activa = 1`, [numero_tarjeta], (err, tarjeta) => {
        if (err || !tarjeta) return res.status(404).json({ error: "Tarjeta no encontrada o inactiva." });

        db.serialize(() => {
            // Actualizar saldo del usuario dueño de la tarjeta
            db.run(`UPDATE usuarios SET balance = balance + ? WHERE id = ?`, [monto, tarjeta.user_id]);
            // Registrar la transacción
            db.run(`INSERT INTO transacciones (user_id, tipo, monto, descripcion) VALUES (?, 'RECOMPENSA', ?, ?)`, 
            [tarjeta.user_id, monto, descripcion]);
        });

        res.json({ mensaje: `Recarga exitosa de $${monto} procesada.` });
    });
});

// Pagar / Comprar con la tarjeta virtual desde tus otras plataformas
app.post('/api/tarjeta/pagar', (req, res) => {
    const { numero_tarjeta, pin, monto, descripcion } = req.body;

    db.get(`SELECT * FROM tarjetas WHERE numero_tarjeta = ? AND pin = ? AND activa = 1`, [numero_tarjeta, pin], (err, tarjeta) => {
        if (err || !tarjeta) return res.status(401).json({ error: "Credenciales de tarjeta inválidas." });

        db.get(`SELECT balance FROM usuarios WHERE id = ?`, [tarjeta.user_id], (err, user) => {
            if (user.balance < monto) return res.status(400).json({ error: "Saldo insuficiente en el banco virtual." });

            db.serialize(() => {
                // Restar saldo
                db.run(`UPDATE usuarios SET balance = balance - ? WHERE id = ?`, [monto, tarjeta.user_id]);
                // Registrar gasto
                db.run(`INSERT INTO transacciones (user_id, tipo, monto, descripcion) VALUES (?, 'COMPRA', ?, ?)`, 
                [tarjeta.user_id, monto, descripcion]);
            });

            res.json({ mensaje: "Pago procesado correctamente. ¡Gracias por tu compra!" });
        });
    });
});

// Ver perfil y saldo
app.get('/api/usuario/balance', verificarToken, (req, res) => {
    db.get(`SELECT username, balance FROM usuarios WHERE id = ?`, [req.userId], (err, user) => {
        res.json(user);
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Banco Virtual corriendo en el puerto ${PORT}`));