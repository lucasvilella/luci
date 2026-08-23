import paramiko
import time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.15.90', port=8022, username='u0_a226', password='Dexter_161121@', timeout=10)

stdin, stdout, stderr = ssh.exec_command('cloudflared tunnel --url http://127.0.0.1:8000')
time.sleep(6)
out = stderr.channel.recv(4096).decode('utf-8', errors='ignore')
print("CLOUDFLARED DIRECT RUN:\n", out)

ssh.close()
