import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.15.90', port=8022, username='u0_a226', password='Dexter_161121@', timeout=10)

stdin, stdout, stderr = ssh.exec_command('proot-distro login debian -- bash -c "nohup cloudflared tunnel --url http://127.0.0.1:8000 > /root/cf_link.log 2>&1 &"; sleep 6; proot-distro login debian -- cat /root/cf_link.log')
print("DEBIAN CF LOG:\n", stdout.read().decode('utf-8', errors='ignore'))

ssh.close()
