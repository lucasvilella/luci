import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('192.168.15.90', port=8022, username='u0_a226', password='Dexter_161121@', timeout=10)

print("1. Testando FastAPI local dentro do Debian (porta 8000)...")
_, stdout, _ = client.exec_command('proot-distro login debian -- bash -c "curl -s http://127.0.0.1:8000/health"')
print("FASTAPI:", stdout.read().decode('utf-8', errors='replace'))

print("2. Testando Ngrok do Termux...")
_, stdout, _ = client.exec_command('curl -s -H "ngrok-skip-browser-warning: 1" https://subdivide-clip-easiest.ngrok-free.dev/health')
print("NGROK:", stdout.read().decode('utf-8', errors='replace'))

print("3. Processos rodando:")
_, stdout, _ = client.exec_command('pm2 list')
print(stdout.read().decode('utf-8', errors='replace'))

client.close()
