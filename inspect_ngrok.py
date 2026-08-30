import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('192.168.15.90', port=8022, username='u0_a226', password='Dexter_161121@', timeout=10)

print("1. Verificando onde está o ngrok e o config...")
_, stdout, _ = client.exec_command('proot-distro login debian -- bash -c "which ngrok ; cat /root/.config/ngrok/ngrok.yml"')
print(stdout.read().decode('utf-8', errors='replace'))

print("2. Testando iniciar o ngrok manualmente por 5 segundos...")
_, stdout, _ = client.exec_command('proot-distro login debian -- bash -c "ngrok http --url=subdivide-clip-easiest.ngrok-free.dev 8000 --log=stdout --log-level=debug > /tmp/ngrok_test.log 2>&1 & sleep 4 ; cat /tmp/ngrok_test.log ; pkill -9 ngrok"')
print(stdout.read().decode('utf-8', errors='replace'))

client.close()
