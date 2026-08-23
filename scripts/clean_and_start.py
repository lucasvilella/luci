import paramiko
import time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.15.90', port=8022, username='u0_a226', password='Dexter_161121@', timeout=10)

# 1. Matar todos os processos zumbis do proot
ssh.exec_command('pkill -9 -f proot; pkill -9 -f uvicorn; pkill -9 -f python; pkill -9 -f cloudflared; pkill -9 -f ngrok')
time.sleep(2)

# 2. Criar script limpo para iniciar o backend e o cloudflare
start_clean = """#!/data/data/com.termux/files/usr/bin/bash
termux-wake-lock
sshd

echo "Iniciando Debian container..."
proot-distro login debian -- bash -c '
  cd /root/luci-server
  nohup /root/luci-server/venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > /root/luci-server/app.log 2>&1 &
'

sleep 4

echo "Iniciando Cloudflare..."
pkill -f cloudflared 2>/dev/null
nohup cloudflared tunnel --url http://127.0.0.1:8000 > /data/data/com.termux/files/home/tunnel.log 2>&1 &

sleep 6
echo "========================================="
grep -o "https://[a-zA-Z0-9.-]*.trycloudflare.com" /data/data/com.termux/files/home/tunnel.log | tail -n 1
echo "========================================="
"""

sftp = ssh.open_sftp()
with sftp.file('/data/data/com.termux/files/usr/bin/luci-start', 'w') as f:
    f.write(start_clean)
sftp.chmod('/data/data/com.termux/files/usr/bin/luci-start', 0o755)
sftp.close()

# 3. Executar o novo luci-start
stdin, stdout, stderr = ssh.exec_command('/data/data/com.termux/files/usr/bin/luci-start')
print("START OUTPUT:\n", stdout.read().decode('utf-8', errors='ignore'))

# 4. Testar curl local
time.sleep(2)
stdin, stdout, stderr = ssh.exec_command('curl -i http://127.0.0.1:8000/health')
print("CURL HEALTH:\n", stdout.read().decode('utf-8', errors='ignore'))

ssh.close()
