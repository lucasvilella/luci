import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.15.90', port=8022, username='u0_a226', password='Dexter_161121@', timeout=10)

stdin, stdout, stderr = ssh.exec_command('proot-distro login debian -- cat /root/luci-server/app.log')
print("APP LOG:\n", stdout.read().decode('utf-8', errors='ignore'))

stdin, stdout, stderr = ssh.exec_command('cat /data/data/com.termux/files/home/tunnel.log')
print("TUNNEL FULL LOG:\n", stdout.read().decode('utf-8', errors='ignore'))

ssh.close()
