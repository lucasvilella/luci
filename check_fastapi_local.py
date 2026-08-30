import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('192.168.15.90', port=8022, username='u0_a226', password='Dexter_161121@', timeout=10)

print("1. Verificando porta 8000 dentro do Debian...")
_, out, _ = client.exec_command('proot-distro login debian -- curl -s http://127.0.0.1:8000/health')
print("FastAPI local:", out.read().decode('utf-8', errors='replace'))

print("2. Verificando se o uvicorn está rodando...")
_, out, _ = client.exec_command('proot-distro login debian -- ps aux | grep uvicorn')
print("Processos uvicorn:\n", out.read().decode('utf-8', errors='replace'))

client.close()
