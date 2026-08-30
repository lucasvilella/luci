import paramiko
import sys
import time

sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('192.168.15.90', port=8022, username='u0_a226', password='Dexter_161121@', timeout=10)

print("1. Matando processos antigos...")
client.exec_command('pkill -9 -f ngrok ; pkill -9 -f uvicorn ; proot-distro login debian -- pkill -9 -f ngrok ; proot-distro login debian -- pkill -9 -f uvicorn')
time.sleep(2)

print("2. Iniciando FastAPI dentro do Debian...")
client.exec_command('proot-distro login debian -- bash -c "cd /root/luci-server && nohup /root/luci-server/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 > /root/uvicorn.log 2>&1 &"')
time.sleep(3)

print("3. Iniciando Ngrok dentro do Debian...")
client.exec_command('proot-distro login debian -- bash -c "nohup ngrok http 8000 --url=https://subdivide-clip-easiest.ngrok-free.dev --log=stdout > /root/ngrok.log 2>&1 &"')
time.sleep(5)

print("4. Verificando log do Ngrok...")
_, out, _ = client.exec_command('proot-distro login debian -- cat /root/ngrok.log')
print(out.read().decode('utf-8', errors='replace'))

print("5. Testando resposta do Ngrok...")
_, out, _ = client.exec_command('curl -s -H "ngrok-skip-browser-warning: 1" https://subdivide-clip-easiest.ngrok-free.dev/health')
print("RESPOSTA NGROK:", out.read().decode('utf-8', errors='replace'))

client.close()
