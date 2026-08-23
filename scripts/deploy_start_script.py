import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.15.90', port=8022, username='u0_a226', password='Dexter_161121@', timeout=10)

with open('e:/Projects/luci/scripts/luci-start-termux.sh', 'r', encoding='utf-8') as f:
    content = f.read()

sftp = ssh.open_sftp()
with sftp.file('/data/data/com.termux/files/usr/bin/luci-start', 'w') as f:
    f.write(content)
sftp.chmod('/data/data/com.termux/files/usr/bin/luci-start', 0o755)
sftp.close()

print("luci-start atualizado no Termux com sucesso!")
ssh.close()
