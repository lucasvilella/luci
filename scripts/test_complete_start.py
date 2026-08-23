import paramiko
import time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.15.90', port=8022, username='u0_a226', password='Dexter_161121@', timeout=10)

# Atualizar no Debian e puxar o main.py corrigido
ssh.exec_command('proot-distro login debian -- bash -c "cd /root/luci-server && git stash && git pull origin main"')

# Iniciar o servidor python uvicorn
ssh.exec_command('pkill -9 -f uvicorn; pkill -9 -f cloudflared')
time.sleep(1)

ssh.exec_command('proot-distro login debian -- bash -c "cd /root/luci-server && nohup /root/luci-server/venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > /root/luci-server/app.log 2>&1 &"')

time.sleep(4)

# Iniciar Cloudflare Tunnel
ssh.exec_command('nohup cloudflared tunnel --url http://127.0.0.1:8000 > /data/data/com.termux/files/home/tunnel.log 2>&1 &')

time.sleep(5)

# Verificar se o backend local respondeu
stdin, stdout, stderr = ssh.exec_command('curl -i http://127.0.0.1:8000/health')
print("HEALTH LOCAL:\n", stdout.read().decode('utf-8', errors='ignore'))

# Pegar a URL pública do Cloudflare
stdin, stdout, stderr = ssh.exec_command('cat /data/data/com.termux/files/home/tunnel.log')
lines = stdout.read().decode('utf-8', errors='ignore').split('\n')
for l in lines:
    if 'trycloudflare.com' in l:
        print("LINK OFICIAL ATIVO:", l.strip())

ssh.close()
