import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('192.168.15.90', port=8022, username='u0_a226', password='Dexter_161121@', timeout=10)

_, out, _ = client.exec_command('proot-distro login debian -- ngrok version')
print("Versão Ngrok:", out.read().decode('utf-8', errors='replace'))

_, out2, _ = client.exec_command('proot-distro login debian -- cat /root/.config/ngrok/ngrok.yml')
print("Config:", out2.read().decode('utf-8', errors='replace'))

client.close()
