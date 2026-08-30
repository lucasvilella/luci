import paramiko
import sys
import time

sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('192.168.15.90', port=8022, username='u0_a226', password='Dexter_161121@', timeout=10)

print("1. Iniciando ngrok em primeiro plano por 4 segundos e capturando a URL gerada...")
_, stdout, stderr = client.exec_command(
    'proot-distro login debian -- bash -c "'
    'ngrok http 8000 --log=stdout'
    '"'
)
time.sleep(3)
client.exec_command('proot-distro login debian -- pkill -9 ngrok')
print("STDOUT:", stdout.read().decode('utf-8', errors='replace'))
print("STDERR:", stderr.read().decode('utf-8', errors='replace'))

client.close()
