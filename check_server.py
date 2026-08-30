import paramiko
import sys
import time

hostname = "192.168.15.90"
port = 8022
username = "u0_a226"
password = "Dexter_161121@"

def check_termux():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"[*] Conectando a {hostname}:{port}...")
    try:
        client.connect(hostname, port=port, username=username, password=password, timeout=10)
        print("[+] Conexão SSH estabelecida com sucesso!")
        
        # 1. Verificar processos ativos
        stdin, stdout, stderr = client.exec_command("ps aux | grep -E 'python|uvicorn|ngrok|next' | grep -v grep")
        processes = stdout.read().decode().strip()
        print("\n--- PROCESSOS EM EXECUÇÃO NO TERMUX ---")
        print(processes or "Nenhum processo da Luci rodando atualmente.")
        
        # 2. Verificar link do ngrok caso esteja rodando
        stdin, stdout, stderr = client.exec_command("curl -s http://127.0.0.1:4040/api/tunnels")
        ngrok_out = stdout.read().decode().strip()
        print("\n--- STATUS DO NGROK (API LOCAL 4040) ---")
        print(ngrok_out or "Ngrok não está ativo ou API indisponível.")

        # 3. Se não estiver rodando ou ngrok inativo, executar luci-start
        if "uvicorn" not in processes or "4040" not in ngrok_out:
            print("\n[*] Disparando comando 'luci-start' no servidor...")
            # Usar canal pseudo-terminal para execução contínua
            stdin, stdout, stderr = client.exec_command("bash -l -c 'luci-start &'")
            time.sleep(3)
            
            stdin, stdout, stderr = client.exec_command("ps aux | grep -E 'python|uvicorn|ngrok' | grep -v grep")
            print("\n--- PROCESSOS APÓS LUCI-START ---")
            print(stdout.read().decode().strip())
            
            time.sleep(2)
            stdin, stdout, stderr = client.exec_command("curl -s http://127.0.0.1:4040/api/tunnels")
            print("\n--- NOVO TUNEL NGROK ---")
            print(stdout.read().decode().strip())

        # 4. Atualizar código do repositório no servidor Termux (git pull)
        print("\n[*] Atualizando código do repositório no servidor...")
        stdin, stdout, stderr = client.exec_command("bash -l -c 'cd ~/luci 2>/dev/null || cd /data/data/com.termux/files/home/luci 2>/dev/null || pwd; git pull origin main'")
        print(stdout.read().decode().strip() or stderr.read().decode().strip())

    except Exception as e:
        print(f"[-] Erro ao conectar ou executar: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    check_termux()
