import paramiko
import sys
import time

sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('192.168.15.90', port=8022, username='u0_a226', password='Dexter_161121@', timeout=10)

print("1. Parando ngrok antigo...")
client.exec_command('pkill -9 -f ngrok ; pm2 delete luci-ngrok-tunnel 2>/dev/null')

print("2. Adicionando token ngrok no Termux...")
client.exec_command('ngrok config add-authtoken 3IH9ZQ81GQk1gaJMeNsuGHuljRJ_4JWNTSB7qKAAfiroiWJDh')

print("3. Iniciando Ngrok nativo no Termux via PM2...")
client.exec_command('pm2 start "ngrok http 8000 --url=subdivide-clip-easiest.ngrok-free.dev --log=stdout" --name luci-ngrok-tunnel')

time.sleep(4)

print("4. Testando acesso externo via Ngrok...")
_, stdout, _ = client.exec_command('curl -s -H "ngrok-skip-browser-warning: 1" https://subdivide-clip-easiest.ngrok-free.dev/health')
print("RESPOSTA NGROK:", stdout.read().decode('utf-8', errors='replace'))

client.close()
