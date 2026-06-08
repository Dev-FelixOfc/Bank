#!/bin/bash

# Asegurar que se ejecuta como root
if [ "$EUID" -ne 0 ]; then
  echo "Por favor, ejecuta este script como root (sudo)."
  exit
fi

echo "========================================================="
echo "  INSTALADOR AUTOMÁTICO PARA TU BANCO VIRTUAL NODE.JS    "
echo "========================================================="

# Pedir datos al usuario
read -p "Introduce el dominio para tu API (ej. api.tudominio.com): " DOMINIO
read -p "Introduce tu email (para alertas de Certbot/SSL): " EMAIL

if [ -z "$DOMINIO" ] || [ -z "$EMAIL" ]; then
    echo "El dominio y el email son obligatorios para configurar SSL."
    exit 1
fi

echo "[-] Actualizando el sistema..."
apt update && apt upgrade -y

echo "[-] Instalando Node.js y herramientas del sistema..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs nginx certbot python3-certbot-nginx git build-essential

echo "[-] Instalando PM2 globalmente (Gestor de procesos de Node)..."
npm install pm2 -g

echo "[-] Configurando la aplicación de Node.js en /var/www/banco-virtual..."
mkdir -p /var/www/banco-virtual
cd /var/www/banco-virtual

# Aquí asumimos que pones tus archivos server.js y database.js en esta carpeta
# Creamos un package.json base por si acaso
cat <<EOF > package.json
{
  "name": "banco-virtual-backend",
  "version": "1.0.0",
  "description": "Backend para sistema de economía virtual",
  "main": "server.js",
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "sqlite3": "^5.1.7"
  }
}
EOF

echo "[-] Instalando dependencias de Node.js (incluyendo SQLite)..."
npm install --unsafe-perm

echo "[-] Configurando el servidor proxy Nginx..."
cat <<EOF > /etc/nginx/sites-available/$DOMINIO
server {
    listen 80;
    server_name $DOMINIO;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -s /etc/nginx/sites-available/$DOMINIO /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
systemctl restart nginx

echo "[-] Solicitando e Instalando Certificado SSL Let's Encrypt..."
certbot --nginx -d $DOMINIO --non-interactive --agree-tos --m $EMAIL --redirect

echo "[-] Iniciando la aplicación con PM2..."
# Nos aseguramos de estar en el directorio correcto antes de lanzar PM2
cd /var/www/banco-virtual
if [ -f "server.js" ]; then
    pm2 start server.js --name "banco-virtual"
    pm2 save
    pm2 startup
else
    echo "[!] ATENCIÓN: El script configuró todo, pero recuerda subir tu 'server.js' y 'database.js' a /var/www/banco-virtual/ y correr 'pm2 restart banco-virtual'."
fi

echo "========================================================="
echo " ¡PROCESO COMPLETADO CON ÉXITO!"
echo " Tu API ya debería estar disponible de forma segura en: https://$DOMINIO"
echo "========================================================="