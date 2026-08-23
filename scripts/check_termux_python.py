import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.15.90', port=8022, username='u0_a226', password='Dexter_161121@', timeout=10)

stdin, stdout, stderr = ssh.exec_command('python -m uvicorn --version')
print("TERMUX PYTHON UVICORN:\n", stdout.read().decode('utf-8', errors='ignore'))
print("TERMUX STDERR:\n", stderr.read().decode('utf-8', errors='ignore'))

ssh.close()
