import paramiko
import time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.15.90', port=8022, username='u0_a226', password='Dexter_161121@', timeout=10)

stdin, stdout, stderr = ssh.exec_command('curl -i http://127.0.0.1:8000/health')
print('HEALTH:\n', stdout.read().decode('utf-8', errors='ignore').encode('ascii', 'ignore').decode('ascii'))

stdin, stdout, stderr = ssh.exec_command('proot-distro login debian -- pm2 list')
print('PM2 LIST:\n', stdout.read().decode('utf-8', errors='ignore').encode('ascii', 'ignore').decode('ascii'))

ssh.close()
