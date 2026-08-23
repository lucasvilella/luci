import paramiko
import time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.15.90', port=8022, username='u0_a226', password='Dexter_161121@', timeout=10)

print("Instalando dependências que faltavam no Debian (ytmusicapi)...")
stdin, stdout, stderr = ssh.exec_command('proot-distro login debian -- /root/luci-server/venv/bin/pip install ytmusicapi google-genai')
print(stdout.read().decode('utf-8', errors='ignore'))

print("Iniciando uvicorn...")
ssh.exec_command('pkill -9 -f uvicorn; pkill -9 -f cloudflared')
time.sleep(1)

ssh.exec_command('proot-distro login debian -- bash -c "cd /root/luci-server && nohup /root/luci-server/venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > /root/luci-server/app.log 2>&1 &"')
time.sleep(4)

print("Iniciando Cloudflare Tunnel...")
ssh.exec_command('nohup cloudflared tunnel --url http://127.0.0.1:8000 > /data/data/com.termux/files/home/tunnel.log 2>&1 &')
time.sleep(5)

stdin, stdout, stderr = ssh.exec_command('curl -i http://127.0.0.1:8000/health')
print("HEALTH STATUS FINAL:\n", stdout.read().decode('utf-8', errors='ignore'))

stdin, stdout, stderr = ssh.exec_command('cat /data/data/com.termux/files/home/tunnel.log')
lines = stdout.read().decode('utf-8', errors='ignore').split('\n')
for l in lines:
    if 'trycloudflare.com' in l:
        print("LINK OFICIAL NOVO:", l.strip())

ssh.close()
