const fs = require('fs');
const path = require('path');
const FILE_PATH = path.join(__dirname, 'banco_virtual.json');

function inicializarJSON() {
    if (!fs.existsSync(FILE_PATH)) {
        const estructuraInicial = {
            usuarios: [],
            tarjetas: [],
            transacciones: []
        };
        fs.writeFileSync(FILE_PATH, JSON.stringify(estructuraInicial, null, 4), 'utf8');
    }
}

function leerDatos() {
    inicializarJSON();
    const contenido = fs.readFileSync(FILE_PATH, 'utf8');
    return JSON.parse(contenido);
}

function guardarDatos(datos) {
    fs.writeFileSync(FILE_PATH, JSON.stringify(datos, null, 4), 'utf8');
}

inicializarJSON();

module.exports = {
    leerDatos,
    guardarDatos
};