import paramiko
import sys
import time

sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('192.168.15.90', port=8022, username='u0_a226', password='Dexter_161121@', timeout=10)

config_v3 = """version: "3"
agent:
  authtoken: 3IH9ZQ81GQk1gaJMeNsuGHuljRJ_4JWNTSB7qKAAfiroiWJDh
tunnels:
  luci-api:
    proto: http
    addr: 8000
    domain: subdivide-clip-easiest.ngrok-free.dev
"""

sftp = client.open_sftp()
with sftp.file('/data/data/com.termux/files/home/ngrok_v3.yml', 'w') as f:
    f.write(config_v3)
sftp.close()

client.exec_command('proot-distro login debian -- cp /data/data/com.termux/files/home/ngrok_v3.yml /root/.config/ngrok/ngrok.yml')

print("Iniciando Ngrok com configuração v3...")
_, out, err = client.exec_command('proot-distro login debian -- ngrok start luci-api --log=stdout & sleep 6 ; curl -s -H "ngrok-skip-browser-warning: 1" https://subdivide-clip-easiest.ngrok-free.dev/health')
print("SAIDA:\n", out.read().decode('utf-8', errors='replace'))
print("ERRO:\n", err.read().decode('utf-8', errors='replace'))

client.close()
