import paramiko
import time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.15.90', port=8022, username='u0_a226', password='Dexter_161121@', timeout=10)

# Iniciar o servidor python uvicorn em background dentro do Termux Debian
cmd = "proot-distro login debian -- bash -c 'cd /root/luci-server && export PYTHONPATH=/root/luci-server && nohup /root/luci-server/venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > /root/luci-server/server.log 2>&1 &'"
stdin, stdout, stderr = ssh.exec_command(cmd)

time.sleep(4)

# Iniciar cloudflared no Termux
ssh.exec_command('pkill -f cloudflared; sleep 1; nohup cloudflared tunnel --url http://127.0.0.1:8000 > ~/cf_live.log 2>&1 &')

time.sleep(5)

stdin, stdout, stderr = ssh.exec_command('curl -i http://127.0.0.1:8000/health')
print("LOCAL HEALTH:\n", stdout.read().decode('utf-8', errors='ignore').encode('ascii', 'ignore').decode('ascii'))

stdin, stdout, stderr = ssh.exec_command('cat ~/cf_live.log')
lines = stdout.read().decode('utf-8', errors='ignore').split('\n')
for l in lines:
    if 'trycloudflare.com' in l:
        print("TUNNEL URL:", l.strip())

ssh.close()
