import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('192.168.15.90', port=8022, username='u0_a226', password='Dexter_161121@', timeout=10)

_, stdout, _ = client.exec_command('cat /data/data/com.termux/files/home/luci-server/start_ngrok.sh')
print(stdout.read().decode('utf-8', errors='replace'))

client.close()
