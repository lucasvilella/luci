import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('192.168.15.90', port=8022, username='u0_a226', password='Dexter_161121@', timeout=10)

print("Testando comando ngrok direto...")
_, stdout, stderr = client.exec_command(
    'proot-distro login debian -- bash -c "'
    'ngrok http 8000 --domain=subdivide-clip-easiest.ngrok-free.dev --log=stdout'
    '"'
)
import time
time.sleep(3)
_, stdout2, _ = client.exec_command('proot-distro login debian -- bash -c "pkill -9 ngrok"')
print("STDOUT:", stdout.read().decode('utf-8', errors='replace'))
print("STDERR:", stderr.read().decode('utf-8', errors='replace'))

client.close()
