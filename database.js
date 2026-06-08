const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./banco_virtual.db');

db.serialize(() => {
    // Tabla de Usuarios
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        balance REAL DEFAULT 0.0
    )`);

    // Tabla de Tarjetas Virtuales
    db.run(`CREATE TABLE IF NOT EXISTS tarjetas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        numero_tarjeta TEXT UNIQUE,
        pin TEXT,
        activa INTEGER DEFAULT 1,
        FOREIGN KEY(user_id) REFERENCES usuarios(id)
    )`);

    // Historial de Transacciones / Misiones
    db.run(`CREATE TABLE IF NOT EXISTS transacciones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        tipo TEXT, -- 'RECOMPENSA', 'COMPRA', 'TRANSFERENCIA'
        monto REAL,
        descripcion TEXT,
        fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES usuarios(id)
    )`);
});

module.exports = db;