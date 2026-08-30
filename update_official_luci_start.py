import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('192.168.15.90', port=8022, username='u0_a226', password='Dexter_161121@', timeout=10)

luci_start_sh = """#!/data/data/com.termux/files/usr/bin/bash
# ============================================================
# luci-start — Inicializador oficial do servidor Luci
# Mata processos antigos e inicia FastAPI + Ngrok Tunnel via PM2
# ============================================================

echo ""
echo "=========================================="
echo "       LUCI — Inicializando Servidor"
echo "=========================================="
echo ""

# [1] Wake-lock + SSH
echo "[1/6] Ativando wake-lock e SSH..."
termux-wake-lock
sshd 2>/dev/null

# [2] Matar processos antigos
echo "[2/6] Encerrando processos antigos..."
/data/data/com.termux/files/usr/bin/pm2 kill 2>/dev/null || true
sleep 1

pkill -9 -f proot 2>/dev/null || true
pkill -9 -f ngrok 2>/dev/null || true
pkill -9 -f uvicorn 2>/dev/null || true

proot-distro login debian -- bash -c "pkill -9 -f ngrok 2>/dev/null; pkill -9 -f uvicorn 2>/dev/null" 2>/dev/null || true
sleep 2

# [3] Atualizar repositório
echo "[3/6] Atualizando codigo do servidor..."
proot-distro login debian -- bash -c "
  cd /root/luci-server
  rm -f .git/index.lock
  git stash 2>/dev/null
  git pull origin main 2>&1 || echo '  (usando versao local)'
" 2>/dev/null

# [4] Configurar ngrok.yml v3
echo "[4/6] Configurando ngrok.yml..."
cat << 'NGROK_CONF' > /data/data/com.termux/files/home/ngrok_v3.yml
version: "3"
agent:
  authtoken: 3IH9ZQ81GQk1gaJMeNsuGHuljRJ_4JWNTSB7qKAAfiroiWJDh
tunnels:
  luci-api:
    proto: http
    addr: 8000
    domain: subdivide-clip-easiest.ngrok-free.dev
NGROK_CONF

proot-distro login debian -- bash -c "mkdir -p /root/.config/ngrok && cp /data/data/com.termux/files/home/ngrok_v3.yml /root/.config/ngrok/ngrok.yml"

# [5] Escrever start scripts
cat << 'START_FASTAPI' > /data/data/com.termux/files/home/luci-server/start.sh
#!/data/data/com.termux/files/usr/bin/bash
exec proot-distro login debian -- bash -c "cd /root/luci-server && source venv/bin/activate && python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000"
START_FASTAPI
chmod +x /data/data/com.termux/files/home/luci-server/start.sh

cat << 'START_NGROK' > /data/data/com.termux/files/home/luci-server/start_ngrok.sh
#!/data/data/com.termux/files/usr/bin/bash
exec proot-distro login debian -- ngrok start --all --config=/root/.config/ngrok/ngrok.yml --log=stdout
START_NGROK
chmod +x /data/data/com.termux/files/home/luci-server/start_ngrok.sh

# [6] Iniciar PM2
echo "[5/6] Iniciando Backend FastAPI + Tunel Ngrok via PM2..."
cd /data/data/com.termux/files/home/luci-server
/data/data/com.termux/files/usr/bin/pm2 start ecosystem.config.js
/data/data/com.termux/files/usr/bin/pm2 save

echo "[6/6] Aguardando servidores iniciarem (10s)..."
sleep 10

HEALTH=$(curl -s -o /dev/null -w "%{http_code}" -H "ngrok-skip-browser-warning: 1" https://subdivide-clip-easiest.ngrok-free.dev/health 2>/dev/null)

echo ""
echo "=========================================="
if [ "$HEALTH" = "200" ]; then
    echo "  ✅ LUCI SERVIDOR ONLINE E ACESSÍVEL!"
    echo "  URL: https://subdivide-clip-easiest.ngrok-free.dev"
    echo "  Health: HTTP $HEALTH"
else
    echo "  Status Ngrok: HTTP $HEALTH"
fi
echo "=========================================="
echo ""
/data/data/com.termux/files/usr/bin/pm2 list
"""

sftp = client.open_sftp()
with sftp.file('/data/data/com.termux/files/usr/bin/luci-start', 'w') as f:
    f.write(luci_start_sh)
sftp.close()

client.exec_command('chmod +x /data/data/com.termux/files/usr/bin/luci-start')
print("luci-start atualizado com sucesso!")
client.close()
