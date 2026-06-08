#!/bin/bash

if [ "$EUID" -ne 0 ]; then
  echo "Por favor, ejecuta este script como root (sudo)."
  exit
fi

echo "========================================================="
echo "        INSTALADOR DE ENTORNOS - BANK KAZUMA             "
echo "========================================================="

read -p "Introduce tu dominio (ej. mi-dominio.com): " DOMINIO
read -p "Introduce tu email para SSL: " EMAIL

if [ -z "$DOMINIO" ] || [ -z "$EMAIL" ]; then
    echo "Faltan datos obligatorios."
    exit 1
fi

apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs nginx certbot python3-certbot-nginx build-essential

npm install pm2 -g

mkdir -p /var/www/bank-kazuma
mkdir -p /var/www/bank-kazuma/routes
mkdir -p /var/www/bank-kazuma/middleware

cd /var/www/bank-kazuma

cat <<EOF > /etc/nginx/sites-available/$DOMINIO
server {
    listen 80;
    server_name $DOMINIO www.$DOMINIO;

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

certbot --nginx -d $DOMINIO -d www.$DOMINIO --non-interactive --agree-tos -m $EMAIL --redirect

echo "========================================================="
echo " Entorno Nginx, SSL y dependencias base listas."
echo " Ubica tus archivos en: /var/www/bank-kazuma/"
echo " Ejecuta: npm install && pm2 start server.js --name bank-kazuma"
echo "========================================================="