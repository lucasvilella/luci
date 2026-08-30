import paramiko
import json

hostname = "192.168.15.90"
port = 8022
username = "u0_a226"
password = "Dexter_161121@"

def inspect_server():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(hostname, port=port, username=username, password=password, timeout=10)

    print("=== 1. ONDE ESTÁ O CÓDIGO DA LUCI? ===")
    stdin, stdout, stderr = client.exec_command("find ~ /data/data/com.termux/files/home -maxdepth 2 -type d 2>/dev/null")
    print(stdout.read().decode())

    print("=== 2. PROOT DEBIAN DIRECTORY ===")
    stdin, stdout, stderr = client.exec_command("proot-distro login debian -- bash -c 'ls -la /root && ls -la /root/luci-server 2>/dev/null || true'")
    print(stdout.read().decode())

    print("=== 3. NGROK LOGS / STATUS DENTRO DO DEBIAN ===")
    stdin, stdout, stderr = client.exec_command("proot-distro login debian -- bash -c 'ps aux | grep ngrok'")
    print(stdout.read().decode())

    print("=== 4. TESTE DE RESPOSTA LOCAL HTTP NO TERMUX (PORTA 8000) ===")
    stdin, stdout, stderr = client.exec_command("curl -s http://127.0.0.1:8000/health || curl -s http://localhost:8000/docs")
    print(stdout.read().decode()[:300])

    client.close()

if __name__ == "__main__":
    inspect_server()
