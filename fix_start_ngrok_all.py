import paramiko
import sys
import time

sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('192.168.15.90', port=8022, username='u0_a226', password='Dexter_161121@', timeout=10)

script_ngrok = """#!/data/data/com.termux/files/usr/bin/bash
exec proot-distro login debian -- ngrok start --all --config=/root/.config/ngrok/ngrok.yml --log=stdout
"""

sftp = client.open_sftp()
with sftp.file('/data/data/com.termux/files/home/luci-server/start_ngrok.sh', 'w') as f:
    f.write(script_ngrok)
sftp.close()

client.exec_command('chmod +x /data/data/com.termux/files/home/luci-server/start_ngrok.sh')
client.exec_command('pm2 restart luci-ngrok-tunnel')

time.sleep(5)

_, out, _ = client.exec_command('pm2 logs luci-ngrok-tunnel --lines 10 --nostream')
print("PM2 LOGS:\n", out.read().decode('utf-8', errors='replace'))

client.close()
