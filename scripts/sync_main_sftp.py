import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.15.90', port=8022, username='u0_a226', password='Dexter_161121@', timeout=10)

with open('e:/Projects/luci/app/main.py', 'r', encoding='utf-8') as f:
    main_code = f.read()

sftp = ssh.open_sftp()
with sftp.file('/data/data/com.termux/files/usr/var/lib/proot-distro/containers/debian/rootfs/root/luci-server/app/main.py', 'w') as f:
    f.write(main_code)
sftp.close()

stdin, stdout, stderr = ssh.exec_command('proot-distro login debian -- bash -c "cd /root/luci-server && /root/luci-server/venv/bin/python app/main.py"')
print("DIRECT STDOUT AFTER SYNC:\n", stdout.read().decode('utf-8', errors='ignore'))
print("DIRECT STDERR AFTER SYNC:\n", stderr.read().decode('utf-8', errors='ignore'))

ssh.close()
