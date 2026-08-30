import paramiko
import sys
import time

sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('192.168.15.90', port=8022, username='u0_a226', password='Dexter_161121@', timeout=10)

print("1. Configurando token no Termux nativo...")
_, out, err = client.exec_command('/data/data/com.termux/files/usr/bin/ngrok config add-authtoken 3IH9ZQ81GQk1gaJMeNsuGHuljRJ_4JWNTSB7qKAAfiroiWJDh')
print("Token config:", out.read().decode('utf-8', errors='replace'))

print("2. Iniciando ngrok nativo em background...")
client.exec_command('nohup /data/data/com.termux/files/usr/bin/ngrok http 8000 --url=https://subdivide-clip-easiest.ngrok-free.dev --log=stdout > /data/data/com.termux/files/home/ngrok.log 2>&1 &')

time.sleep(5)

print("3. Verificando log do Ngrok nativo...")
_, out, _ = client.exec_command('cat /data/data/com.termux/files/home/ngrok.log')
print(out.read().decode('utf-8', errors='replace'))

print("4. Testando health check pelo ngrok...")
_, out, _ = client.exec_command('curl -s -H "ngrok-skip-browser-warning: 1" https://subdivide-clip-easiest.ngrok-free.dev/health')
print("RESPOSTA NGROK:", out.read().decode('utf-8', errors='replace'))

client.close()
