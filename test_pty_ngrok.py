import paramiko
import sys
import time

sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('192.168.15.90', port=8022, username='u0_a226', password='Dexter_161121@', timeout=10)

pty_runner = """
import pty
import subprocess
import os
import time

master, slave = pty.openpty()
p = subprocess.Popen(
    ['ngrok', 'http', '8000', '--url=https://subdivide-clip-easiest.ngrok-free.dev', '--log=stdout'],
    stdin=slave,
    stdout=slave,
    stderr=slave,
    close_fds=True
)

time.sleep(6)
os.close(slave)
output = os.read(master, 2048)
os.close(master)
print("PTY OUTPUT:", output.decode('utf-8', errors='replace'))
"""

sftp = client.open_sftp()
with sftp.file('/data/data/com.termux/files/home/pty_ngrok.py', 'w') as f:
    f.write(pty_runner)
sftp.close()

_, out, err = client.exec_command('proot-distro login debian -- python3 /data/data/com.termux/files/home/pty_ngrok.py')
print(out.read().decode('utf-8', errors='replace'))
print(err.read().decode('utf-8', errors='replace'))

print("Testando health check externo via Ngrok...")
_, out, _ = client.exec_command('curl -s -H "ngrok-skip-browser-warning: 1" https://subdivide-clip-easiest.ngrok-free.dev/health')
print("HEALTH:", out.read().decode('utf-8', errors='replace'))

client.close()
