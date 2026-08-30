import paramiko
import sys
import time

sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('192.168.15.90', port=8022, username='u0_a226', password='Dexter_161121@', timeout=10)

print("1. Ajustando start_ngrok.sh para rodar perfeitamente...")
sftp = client.open_sftp()
with sftp.file('/data/data/com.termux/files/home/luci-server/start_ngrok.sh', 'w') as f:
    f.write("#!/data/data/com.termux/files/usr/bin/bash\nproot-distro login debian -- ngrok http 8000 --url=https://subdivide-clip-easiest.ngrok-free.dev --log=stdout\n")
sftp.close()
client.exec_command('chmod +x /data/data/com.termux/files/home/luci-server/start_ngrok.sh')

print("2. Reiniciando os processos no PM2...")
client.exec_command('pm2 restart all')
time.sleep(8)

print("3. Testando resposta pública do Ngrok...")
_, out, _ = client.exec_command('curl -s -H "ngrok-skip-browser-warning: 1" https://subdivide-clip-easiest.ngrok-free.dev/health')
print("RESPOSTA:", out.read().decode('utf-8', errors='replace'))

client.close()
