import paramiko
import sys
import time

sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('192.168.15.90', port=8022, username='u0_a226', password='Dexter_161121@', timeout=10)

print("1. Escrevendo start_ngrok.sh de forma limpa...")
script_content = """#!/data/data/com.termux/files/usr/bin/bash
exec proot-distro login debian -- ngrok http 8000 --url=https://subdivide-clip-easiest.ngrok-free.dev --authtoken=3IH9ZQ81GQk1gaJMeNsuGHuljRJ_4JWNTSB7qKAAfiroiWJDh --log=stdout
"""

sftp = client.open_sftp()
with sftp.file('/data/data/com.termux/files/home/luci-server/start_ngrok.sh', 'w') as f:
    f.write(script_content)
sftp.close()

client.exec_command('chmod +x /data/data/com.termux/files/home/luci-server/start_ngrok.sh')

print("2. Reiniciando o processo luci-ngrok-tunnel no PM2...")
client.exec_command('pm2 restart luci-ngrok-tunnel')

time.sleep(6)

print("3. Log do túnel ngrok:")
_, out, _ = client.exec_command('pm2 logs luci-ngrok-tunnel --lines 15 --nostream')
print(out.read().decode('utf-8', errors='replace'))

print("4. Testando health check externo via Ngrok...")
_, out, _ = client.exec_command('curl -s -H "ngrok-skip-browser-warning: 1" https://subdivide-clip-easiest.ngrok-free.dev/health')
print("RESPOSTA NGROK:", out.read().decode('utf-8', errors='replace'))

client.close()
