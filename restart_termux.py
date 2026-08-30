import paramiko
import time

hostname = "192.168.15.90"
port = 8022
username = "u0_a226"
password = "Dexter_161121@"

def update_and_restart():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(hostname, port=port, username=username, password=password, timeout=10)

    print("[1/5] Atualizando o código no repositório /root/luci-server...")
    stdin, stdout, stderr = client.exec_command("proot-distro login debian -- bash -c 'cd /root/luci-server && git reset --hard origin/main && git pull origin main'")
    print(stdout.read().decode())
    print(stderr.read().decode())

    print("[2/5] Encerrando processos antigos (uvicorn, ngrok, python)...")
    stdin, stdout, stderr = client.exec_command("killall -9 python python3 ngrok uvicorn 2>/dev/null || true")
    client.exec_command("proot-distro login debian -- bash -c 'killall -9 python python3 ngrok uvicorn 2>/dev/null || true'")
    time.sleep(2)

    print("[3/5] Verificando arquivo start_luci.sh e iniciando a Luci...")
    stdin, stdout, stderr = client.exec_command("proot-distro login debian -- bash -c 'cat /root/start_luci.sh'")
    print("Script start_luci.sh:", stdout.read().decode())

    # Iniciar uvicorn e ngrok em background dentro do PRoot Debian
    start_cmd = (
        "proot-distro login debian -- bash -c '"
        "nohup bash -c \"cd /root/luci-server && source venv/bin/activate && python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000\" > /root/uvicorn.log 2>&1 & "
        "nohup ngrok http 8000 --url=https://subdivide-clip-easiest.ngrok-free.dev --log=stdout > /root/ngrok.log 2>&1 &"
        "'"
    )
    stdin, stdout, stderr = client.exec_command(start_cmd)
    time.sleep(4)

    print("[4/5] Verificando se os processos estão rodando...")
    stdin, stdout, stderr = client.exec_command("proot-distro login debian -- bash -c 'ps aux | grep -E \"uvicorn|ngrok\" | grep -v grep'")
    print(stdout.read().decode())

    print("[5/5] Logs do Ngrok:")
    stdin, stdout, stderr = client.exec_command("proot-distro login debian -- bash -c 'tail -n 20 /root/ngrok.log'")
    print(stdout.read().decode())

    print("[6/5] Logs do Uvicorn:")
    stdin, stdout, stderr = client.exec_command("proot-distro login debian -- bash -c 'tail -n 20 /root/uvicorn.log'")
    print(stdout.read().decode())

    client.close()

if __name__ == "__main__":
    update_and_restart()
