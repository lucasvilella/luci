import paramiko
import time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.15.90', port=8022, username='u0_a226', password='Dexter_161121@', timeout=10)

# Checar o IP local
stdin, stdout, stderr = ssh.exec_command('ifconfig wlan0 | grep "inet "')
print("IP LOCAL:", stdout.read().decode('utf-8'))

ssh.close()
