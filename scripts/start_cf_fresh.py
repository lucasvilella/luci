import paramiko
import time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.15.90', port=8022, username='u0_a226', password='Dexter_161121@', timeout=10)

# Iniciar cloudflared com log limpo no Termux
ssh.exec_command('nohup cloudflared tunnel --url http://127.0.0.1:8000 > /data/data/com.termux/files/home/cf_active.log 2>&1 &')
time.sleep(6)

stdin, stdout, stderr = ssh.exec_command('cat /data/data/com.termux/files/home/cf_active.log')
lines = stdout.read().decode('utf-8', errors='ignore').split('\n')
for l in lines:
    if 'trycloudflare.com' in l:
        print("LINK DEFINITIVO ATIVO:", l.strip())

ssh.close()
