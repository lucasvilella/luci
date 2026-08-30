import paramiko
import sys
import time

sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('192.168.15.90', port=8022, username='u0_a226', password='Dexter_161121@', timeout=10)

print("1. Matando ngroks antigos...")
client.exec_command('pkill -9 -f ngrok ; proot-distro login debian -- bash -c "pkill -9 -f ngrok 2>/dev/null"')
time.sleep(2)

print("2. Iniciando ngrok dentro do Debian PRoot...")
client.exec_command(
    'proot-distro login debian -- bash -c "'
    'nohup ngrok http 8000 --url=https://subdivide-clip-easiest.ngrok-free.dev --log=stdout > /root/ngrok_debian.log 2>&1 &'
    '"'
)
time.sleep(6)

print("3. Log do Ngrok Debian:")
_, out, _ = client.exec_command('proot-distro login debian -- bash -c "cat /root/ngrok_debian.log"')
print(out.read().decode('utf-8', errors='replace'))

print("4. Testando health check externo via Ngrok:")
_, out, _ = client.exec_command('curl -s -H "ngrok-skip-browser-warning: 1" https://subdivide-clip-easiest.ngrok-free.dev/health')
print("HEALTH:", out.read().decode('utf-8', errors='replace'))

client.close()
