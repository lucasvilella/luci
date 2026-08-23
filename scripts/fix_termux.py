import paramiko
import time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.15.90', port=8022, username='u0_a226', password='Dexter_161121@', timeout=10)

eco = """module.exports = {
  apps: [
    {
      name: 'luci-core-api',
      script: '/root/luci-server/venv/bin/python',
      args: '-m uvicorn app.main:app --host 0.0.0.0 --port 8000',
      cwd: '/root/luci-server',
      interpreter: 'none',
      autorestart: true,
      watch: false,
      max_memory_restart: '600M',
      env: {
        NODE_ENV: 'production',
        PORT: '8000',
        PYTHONUNBUFFERED: '1',
        PYTHONPATH: '/root/luci-server'
      }
    }
  ]
};
"""

sftp = ssh.open_sftp()
with sftp.file('/data/data/com.termux/files/usr/var/lib/proot-distro/containers/debian/rootfs/root/luci-server/ecosystem.config.js', 'w') as f:
    f.write(eco)
sftp.close()

# Reiniciar processos dentro do Debian
script = """
cd /root/luci-server
pm2 delete all
pm2 start ecosystem.config.js
pm2 save
"""
stdin, stdout, stderr = ssh.exec_command(f'proot-distro login debian -- bash -c "{script}"')
print("STDOUT:\n", stdout.read().decode('utf-8', errors='ignore'))
print("STDERR:\n", stderr.read().decode('utf-8', errors='ignore'))

time.sleep(3)

# Testar curl interno
stdin, stdout, stderr = ssh.exec_command('curl -s http://127.0.0.1:8000/health')
print("HEALTH RESULT:\n", stdout.read().decode('utf-8', errors='ignore'))

ssh.close()
