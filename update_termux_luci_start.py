import paramiko

def update_luci_start():
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect("192.168.15.90", port=8022, username="u0_a226", password="Dexter_161121@")

    new_script = """#!/data/data/com.termux/files/usr/bin/bash
echo " [Luci] Mantendo CPU ativa e iniciando SSH..."
termux-wake-lock
sshd

echo " [Luci] Encerrando processos antigos e sessoes do Ngrok..."
killall -9 python python3 ngrok uvicorn 2>/dev/null || true
proot-distro login debian -- bash -c 'killall -9 python python3 ngrok uvicorn 2>/dev/null || true'
/data/data/com.termux/files/usr/bin/pm2 kill 2>/dev/null || true
sleep 2

echo " [Luci] Atualizando Debian..."
proot-distro login debian -- bash -c "
  cd /root/luci-server
  rm -f .git/index.lock
  git stash 2>/dev/null
  git pull origin main || true
"

echo " [Luci] Configurando ecossistema PM2..."
cat << 'ECOSYSTEM_INLINE' > /data/data/com.termux/files/home/luci-server/ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "luci-core-api",
      script: "/data/data/com.termux/files/home/luci-server/start.sh",
      cwd: "/data/data/com.termux/files/home/luci-server",
      interpreter: "/data/data/com.termux/files/usr/bin/bash",
      autorestart: true,
      watch: false,
      max_memory_restart: "600M",
      env: {
        NODE_ENV: "production",
        PORT: 8000,
        PYTHONUNBUFFERED: "1"
      }
    },
    {
      name: "luci-ngrok-tunnel",
      script: "/data/data/com.termux/files/home/luci-server/start_ngrok.sh",
      cwd: "/data/data/com.termux/files/home/luci-server",
      interpreter: "/data/data/com.termux/files/usr/bin/bash",
      autorestart: true,
      watch: false,
      max_memory_restart: "300M"
    }
  ]
};
ECOSYSTEM_INLINE

echo " [Luci] Iniciando Backend FastAPI e Tunel Ngrok via PM2..."
cd /data/data/com.termux/files/home/luci-server
/data/data/com.termux/files/usr/bin/pm2 start ecosystem.config.js
/data/data/com.termux/files/usr/bin/pm2 save

sleep 4
echo "--------------------------------------------------------"
echo " [Luci] SERVIDOR E TUNEL ONLINE!"
echo " ACESSE: https://subdivide-clip-easiest.ngrok-free.dev"
echo "--------------------------------------------------------"
"""
    sftp = c.open_sftp()
    with sftp.file('/data/data/com.termux/files/usr/bin/luci-start', 'w') as f:
        f.write(new_script.replace('\r\n', '\n'))
    sftp.close()
    c.exec_command('chmod +x /data/data/com.termux/files/usr/bin/luci-start')
    c.close()
    print("LUCI-START UPDATED SUCCESSFULLY!")

if __name__ == "__main__":
    update_luci_start()
