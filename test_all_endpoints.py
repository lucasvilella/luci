import httpx
import json
import sys

BASE_URL = "https://subdivide-clip-easiest.ngrok-free.dev"
HEADERS = {"ngrok-skip-browser-warning": "true"}

def run_tests():
    print(f"[*] Iniciando bateria completa de testes de integridade em {BASE_URL}...")
    errors = []

    # 1. Health Check
    try:
        r = httpx.get(f"{BASE_URL}/health", headers=HEADERS, timeout=10)
        if r.status_code == 200:
            print(f"[OK] 1. Health Check: Status {r.status_code} ({r.json().get('status')})")
        else:
            errors.append(f"1. Health Check falhou com status {r.status_code}")
    except Exception as e:
        errors.append(f"1. Health Check exception: {e}")

    # 2. Frontend Estático & Bundle
    try:
        r = httpx.get(f"{BASE_URL}/", headers=HEADERS, timeout=10)
        if r.status_code == 200 and "_next/static/chunks" in r.text:
            print(f"[OK] 2. Frontend Estatico: HTML OK ({len(r.text)} bytes)")
        else:
            errors.append(f"2. Frontend Estatico falhou com status {r.status_code}")
    except Exception as e:
        errors.append(f"2. Frontend Estatico exception: {e}")

    # 3. Cérebro Cognitivo da Luci / Diálogo
    try:
        payload = {"message": "Ola Luci, você está online?", "userId": "lucas"}
        r = httpx.post(f"{BASE_URL}/api/v1/chat/text", json=payload, headers=HEADERS, timeout=15)
        if r.status_code == 200:
            reply = r.json().get("reply", "")
            print(f"[OK] 3. Cerebro Cognitivo / Chat: Resposta recebida -> '{reply[:50]}...'")
        else:
            errors.append(f"3. Chat falhou com status {r.status_code}")
    except Exception as e:
        errors.append(f"3. Chat exception: {e}")

    # 4. Síntese de Voz (TTS)
    try:
        payload = {"text": "Sistema operacional Luci online.", "voice": "pt-BR-ThalitaNeural"}
        r = httpx.post(f"{BASE_URL}/api/v1/chat/tts", json=payload, headers=HEADERS, timeout=15)
        if r.status_code == 200 and len(r.content) > 500:
            print(f"[OK] 4. Sintese TTS (Edge-TTS): Audio gerado ({len(r.content)} bytes)")
        else:
            errors.append(f"4. TTS falhou com status {r.status_code}")
    except Exception as e:
        errors.append(f"4. TTS exception: {e}")

    # 5. Feed Início do LuciMusic
    try:
        r = httpx.get(f"{BASE_URL}/api/v1/music/home?userId=lucas", headers=HEADERS, timeout=15)
        if r.status_code == 200:
            mixes = r.json().get("daily_mixes", [])
            print(f"[OK] 5. LuciMusic Feed Home: {len(mixes)} Daily Mixes curados")
        else:
            errors.append(f"5. Music Home falhou com status {r.status_code}")
    except Exception as e:
        errors.append(f"5. Music Home exception: {e}")

    # 6. Busca no LuciMusic
    try:
        r = httpx.get(f"{BASE_URL}/api/v1/music/search?q=Alok", headers=HEADERS, timeout=15)
        if r.status_code == 200:
            results = r.json().get("results", [])
            print(f"[OK] 6. LuciMusic Busca: {len(results)} faixas encontradas")
        else:
            errors.append(f"6. Music Search falhou com status {r.status_code}")
    except Exception as e:
        errors.append(f"6. Music Search exception: {e}")

    # 7. Dispositivos da Casa Inteligente (Home Core)
    try:
        r = httpx.get(f"{BASE_URL}/api/v1/home/devices", headers=HEADERS, timeout=10)
        if r.status_code == 200:
            devices = r.json()
            print(f"[OK] 7. Casa Inteligente: {len(devices)} dispositivos conectados")
        else:
            errors.append(f"7. Home Devices falhou com status {r.status_code}")
    except Exception as e:
        errors.append(f"7. Home Devices falhou: {e}")

    print("\n" + "="*50)
    if not errors:
        print("[SUCESSO TOTAL] TODOS OS 7 MODULOS E ROTAS PASSARAM SEM ERROS!")
    else:
        print(f"[FALHA] {len(errors)} erros:")
        for err in errors:
            print(f"  - {err}")

if __name__ == "__main__":
    run_tests()
