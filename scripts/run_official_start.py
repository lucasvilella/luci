import paramiko
import time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.15.90', port=8022, username='u0_a226', password='Dexter_161121@', timeout=10)

# Iniciar o servidor python direto no debian container
cmd = "proot-distro login debian -- /root/start.sh"
stdin, stdout, stderr = ssh.exec_command(cmd)
print("START OUTPUT:", stdout.read().decode('utf-8', errors='ignore'))

time.sleep(3)

# Checar o log
stdin, stdout, stderr = ssh.exec_command('proot-distro login debian -- cat /root/luci.log')
print("LUCI.LOG:\n", stdout.read().decode('utf-8', errors='ignore'))

# Checar health
stdin, stdout, stderr = ssh.exec_command('curl -i http://127.0.0.1:8000/health')
print("HEALTH:\n", stdout.read().decode('utf-8', errors='ignore'))

ssh.close()
