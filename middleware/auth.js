const jwt = require('jsonwebtoken');
const JWT_SECRET = 'KazumaEcosystemSecretKey2026';

function verificarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Formato de token invalido' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Token invalido o expirado' });
        }
        req.userId = decoded.id;
        next();
    });
}

module.exports = {
    verificarToken,
    JWT_SECRET
};