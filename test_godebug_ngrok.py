import paramiko
import sys
import time

sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('192.168.15.90', port=8022, username='u0_a226', password='Dexter_161121@', timeout=10)

script = """#!/data/data/com.termux/files/usr/bin/bash
export SSL_CERT_DIR=/system/etc/security/cacerts
export SSL_CERT_FILE=/data/data/com.termux/files/usr/etc/tls/cert.pem
export GODEBUG=netdns=go
exec /data/data/com.termux/files/usr/bin/ngrok http 8000 --url=https://subdivide-clip-easiest.ngrok-free.dev --log=stdout
"""
sftp = client.open_sftp()
with sftp.file('/data/data/com.termux/files/home/termux_ngrok.sh', 'w') as f:
    f.write(script)
sftp.close()

_, out, err = client.exec_command('/data/data/com.termux/files/home/termux_ngrok.sh & sleep 6 ; pkill -9 ngrok')
print("OUT:", out.read().decode('utf-8', errors='replace'))
print("ERR:", err.read().decode('utf-8', errors='replace'))

client.close()
