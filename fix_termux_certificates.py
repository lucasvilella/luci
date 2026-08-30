import paramiko
import sys
import time

sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('192.168.15.90', port=8022, username='u0_a226', password='Dexter_161121@', timeout=10)

print("1. Instalando ca-certificates no Termux...")
_, out, err = client.exec_command('pkg install -y ca-certificates')
print(out.read().decode('utf-8', errors='replace'))

print("2. Matando ngrok antigo...")
client.exec_command('pkill -9 -f ngrok')
time.sleep(2)

print("3. Reiniciando ngrok nativo...")
client.exec_command('nohup ngrok http 8000 --url=https://subdivide-clip-easiest.ngrok-free.dev --log=stdout > /data/data/com.termux/files/home/ngrok.log 2>&1 &')
time.sleep(5)

print("4. Log do ngrok:")
_, out, _ = client.exec_command('cat /data/data/com.termux/files/home/ngrok.log')
print(out.read().decode('utf-8', errors='replace'))

print("5. Testando Ngrok externo:")
_, out, _ = client.exec_command('curl -s -H "ngrok-skip-browser-warning: 1" https://subdivide-clip-easiest.ngrok-free.dev/health')
print("HEALTH:", out.read().decode('utf-8', errors='replace'))

client.close()
