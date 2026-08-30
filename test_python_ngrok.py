import paramiko
import sys
import time

sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('192.168.15.90', port=8022, username='u0_a226', password='Dexter_161121@', timeout=10)

print("1. Criando run_tunnel.py no Debian...")
tunnel_code = '''
import subprocess
import time
import sys

authtoken = "3IH9ZQ81GQk1gaJMeNsuGHuljRJ_4JWNTSB7qKAAfiroiWJDh"
url = "https://subdivide-clip-easiest.ngrok-free.dev"

# Configura token
subprocess.run(["ngrok", "config", "add-authtoken", authtoken], check=False)

# Roda ngrok
cmd = ["ngrok", "http", "8000", f"--url={url}", "--log=stdout"]
print(f"Iniciando Ngrok: {' '.join(cmd)}")
sys.stdout.flush()

p = subprocess.Popen(cmd)
p.wait()
'''

sftp = client.open_sftp()
with sftp.file('/data/data/com.termux/files/home/run_tunnel.py', 'w') as f:
    f.write(tunnel_code)
sftp.close()

print("2. Testando rodar run_tunnel.py por 8 segundos...")
_, out, err = client.exec_command('proot-distro login debian -- python3 /data/data/com.termux/files/home/run_tunnel.py & sleep 8 ; curl -s -H "ngrok-skip-browser-warning: 1" https://subdivide-clip-easiest.ngrok-free.dev/health')
print("SAIDA:", out.read().decode('utf-8', errors='replace'))
print("ERRO:", err.read().decode('utf-8', errors='replace'))

client.close()
