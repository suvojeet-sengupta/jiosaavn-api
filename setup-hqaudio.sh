#!/bin/bash

# 1. Docker install
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# 2. Repo clone
cd ~
git clone https://github.com/suvojeet-sengupta/hqaudio-api.git
cd hqaudio-api
docker compose up -d

# 3. Nginx
apt install nginx certbot python3-certbot-nginx -y

cat > /etc/nginx/sites-available/hqaudio << 'EOF'
server {
    listen 80;
    server_name hqaudio.suvojeetsengupta.in;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

ln -s /etc/nginx/sites-available/hqaudio /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# 4. SSL
certbot --nginx -d hqaudio.suvojeetsengupta.in --non-interactive --agree-tos -m your@email.com

echo "✅ Done! hqaudio.suvojeetsengupta.in live hai"
