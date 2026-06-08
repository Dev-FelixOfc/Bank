const jwt = require('jsonwebtoken');
const db = require('../database');
const JWT_SECRET = "Kazuma_Secret_Key_Global_System";

const verificarToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ error: "No token" });
    
    jwt.verify(token.split(" ")[1], JWT_SECRET, (err, decoded) => {
        if (err) return res.status(500).json({ error: "Auth fail" });
        req.userId = decoded.id;
        
        db.get(`SELECT rol FROM usuarios WHERE id = ?`, [req.userId], (err, user) => {
            if (!user) return res.status(404).json({ error: "User not found" });
            req.userRol = user.rol;
            next();
        });
    });
};

const verificarAdmin = (req, res, next) => {
    if (req.userRol !== 'ADMIN') return res.status(403).json({ error: "Access denied" });
    next();
};

module.exports = { verificarToken, verificarAdmin, JWT_SECRET };