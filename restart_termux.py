"""
restart_termux.py — Reinicia o servidor Luci no celular via SSH.
Faz git pull e depois executa luci-start (que mata processos antigos e reinicia via PM2).
"""
import paramiko
import time
import sys

sys.stdout.reconfigure(encoding='utf-8')

hostname = "192.168.15.90"
port = 8022
username = "u0_a226"
password = "Dexter_161121@"

def update_and_restart():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(hostname, port=port, username=username, password=password, timeout=10)

    print("[1/3] Atualizando o código no repositório /root/luci-server...")
    _, stdout, stderr = client.exec_command(
        "proot-distro login debian -- bash -c '"
        "cd /root/luci-server && "
        "rm -f .git/index.lock && "
        "git stash 2>/dev/null; "
        "git pull origin main 2>&1 || echo \"(git pull falhou, usando versao local)\"'"
    )
    print(stdout.read().decode('utf-8', errors='replace'))

    print("[2/3] Executando luci-start (mata processos antigos + PM2 reinicia)...")
    _, stdout, stderr = client.exec_command(
        "bash /data/data/com.termux/files/usr/bin/luci-start",
        timeout=90
    )
    print(stdout.read().decode('utf-8', errors='replace'))
    err_output = stderr.read().decode('utf-8', errors='replace')
    if err_output.strip():
        print("STDERR:", err_output[:500])

    print("[3/3] Verificação final via Ngrok...")
    _, stdout, _ = client.exec_command(
        'proot-distro login debian -- bash -c "'
        "curl -s -o /dev/null -w '%{http_code}' -H 'ngrok-skip-browser-warning: 1' "
        "https://subdivide-clip-easiest.ngrok-free.dev/ 2>&1"
        '"'
    )
    code = stdout.read().decode('utf-8', errors='replace').strip()
    if code == "200":
        print(f"\n✅ Servidor online! HTTP {code}")
        print("   URL: https://subdivide-clip-easiest.ngrok-free.dev")
    else:
        print(f"\n⚠️  HTTP {code} — servidor pode estar iniciando, tente novamente em 10s")

    client.close()

if __name__ == "__main__":
    update_and_restart()
