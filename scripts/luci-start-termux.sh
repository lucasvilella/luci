#!/data/data/com.termux/files/usr/bin/bash
echo " [Luci] Mantendo CPU ativa e iniciando SSH..."
termux-wake-lock
sshd

echo " [Luci] Atualizando repositório..."
cd /data/data/com.termux/files/home/luci-server
git stash 2>/dev/null
git pull origin main

echo " [Luci] Iniciando Backend FastAPI no Debian..."
proot-distro login debian -- bash -c "
  cd /root/luci-server
  git stash 2>/dev/null
  git pull origin main
  pm2 delete all 2>/dev/null
  pm2 start ecosystem.config.js
  pm2 save
"

echo " [Luci] Iniciando Túnel Cloudflare..."
pkill -f cloudflared 2>/dev/null
nohup cloudflared tunnel --url http://127.0.0.1:8000 > /data/data/com.termux/files/home/cloudflare_tunnel.log 2>&1 &

sleep 6
echo "--------------------------------------------------------"
echo " [Luci] LINK DE ACESSO ONLINE:"
grep -o "https://[a-zA-Z0-9.-]*.trycloudflare.com" /data/data/com.termux/files/home/cloudflare_tunnel.log | tail -n 1
echo "--------------------------------------------------------"
