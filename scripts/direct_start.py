import paramiko
import time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.15.90', port=8022, username='u0_a226', password='Dexter_161121@', timeout=10)

# 1. Matar qualquer processo anterior
ssh.exec_command('pkill -f uvicorn; pkill -f python; pkill -f cloudflared; proot-distro login debian -- pm2 kill')

# 2. Criar script de inicialização direta dentro do Debian
startup_sh = """#!/bin/bash
cd /root/luci-server
export PYTHONPATH=/root/luci-server
nohup /root/luci-server/venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > /root/luci-server/uvicorn.log 2>&1 &
"""

sftp = ssh.open_sftp()
with sftp.file('/data/data/com.termux/files/usr/var/lib/proot-distro/containers/debian/rootfs/root/start_luci.sh', 'w') as f:
    f.write(startup_sh)
sftp.chmod('/data/data/com.termux/files/usr/var/lib/proot-distro/containers/debian/rootfs/root/start_luci.sh', 0o755)
sftp.close()

# 3. Executar o script no Debian
ssh.exec_command('proot-distro login debian -- /root/start_luci.sh')

time.sleep(4)

# 4. Checar health
stdin, stdout, stderr = ssh.exec_command('curl -i http://127.0.0.1:8000/health')
print("HEALTH LOCAL:\n", stdout.read().decode('utf-8', errors='ignore').encode('ascii', 'ignore').decode('ascii'))

# 5. Iniciar Cloudflared
ssh.exec_command('nohup cloudflared tunnel --url http://127.0.0.1:8000 > /data/data/com.termux/files/home/cf.log 2>&1 &')
time.sleep(5)

stdin, stdout, stderr = ssh.exec_command('cat /data/data/com.termux/files/home/cf.log')
lines = stdout.read().decode('utf-8', errors='ignore').split('\n')
for l in lines:
    if 'trycloudflare.com' in l:
        print("LINK ENCONTRADO:", l.strip())

ssh.close()
