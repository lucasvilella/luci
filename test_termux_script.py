import paramiko
import sys
import time

sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('192.168.15.90', port=8022, username='u0_a226', password='Dexter_161121@', timeout=10)

print("1. Criando script termux_ngrok.sh...")
script = """#!/data/data/com.termux/files/usr/bin/bash
export SSL_CERT_FILE=/data/data/com.termux/files/usr/etc/tls/cert.pem
export CURL_CA_BUNDLE=/data/data/com.termux/files/usr/etc/tls/cert.pem
exec /data/data/com.termux/files/usr/bin/ngrok http 8000 --url=https://subdivide-clip-easiest.ngrok-free.dev --log=stdout
"""
sftp = client.open_sftp()
with sftp.file('/data/data/com.termux/files/home/termux_ngrok.sh', 'w') as f:
    f.write(script)
sftp.close()
client.exec_command('chmod +x /data/data/com.termux/files/home/termux_ngrok.sh')

print("2. Testando rodar termux_ngrok.sh por 6 segundos...")
_, out, err = client.exec_command('/data/data/com.termux/files/home/termux_ngrok.sh & sleep 5 ; pkill -9 ngrok')
print("OUT:", out.read().decode('utf-8', errors='replace'))
print("ERR:", err.read().decode('utf-8', errors='replace'))

client.close()
