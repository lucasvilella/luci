import paramiko
import sys
import time

sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('192.168.15.90', port=8022, username='u0_a226', password='Dexter_161121@', timeout=10)

print("Iniciando ngrok por 12 segundos para ver a saída completa...")
_, stdout, stderr = client.exec_command(
    'proot-distro login debian -- bash -c "'
    'ngrok http 8000 --url=https://subdivide-clip-easiest.ngrok-free.dev --log=stdout'
    '"'
)
time.sleep(10)
_, _, _ = client.exec_command('proot-distro login debian -- pkill -9 ngrok')
print("STDOUT:\n", stdout.read().decode('utf-8', errors='replace'))
print("STDERR:\n", stderr.read().decode('utf-8', errors='replace'))

client.close()
