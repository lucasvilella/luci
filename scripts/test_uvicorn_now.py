import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.15.90', port=8022, username='u0_a226', password='Dexter_161121@', timeout=10)

stdin, stdout, stderr = ssh.exec_command('proot-distro login debian -- bash -c "cd /root/luci-server && /root/luci-server/venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"')
import time
time.sleep(3)
try:
    print("STDOUT:\n", stdout.channel.recv(2048).decode('utf-8', errors='ignore'))
    print("STDERR:\n", stderr.channel.recv(2048).decode('utf-8', errors='ignore'))
except Exception as e:
    print("ERR:", e)

ssh.close()
