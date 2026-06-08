const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./banco_virtual.db');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        email TEXT UNIQUE,
        password TEXT,
        alias TEXT UNIQUE,
        perfil_publico INTEGER DEFAULT 0,
        rol TEXT DEFAULT 'USER',
        balance REAL DEFAULT 0.0
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS tarjetas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        numero_tarjeta TEXT UNIQUE,
        pin TEXT,
        activa INTEGER DEFAULT 1,
        FOREIGN KEY(user_id) REFERENCES usuarios(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS transacciones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        tipo TEXT,
        monto REAL,
        descripcion TEXT,
        fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES usuarios(id)
    )`);
});

module.exports = db;