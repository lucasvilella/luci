import paramiko
import time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.15.90', port=8022, username='u0_a226', password='Dexter_161121@', timeout=10)

time.sleep(2)
stdin, stdout, stderr = ssh.exec_command('curl -i http://127.0.0.1:8000/health')
print("HEALTH STATUS:\n", stdout.read().decode('utf-8', errors='ignore'))

ssh.close()
