import requests
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "https://subdivide-clip-easiest.ngrok-free.dev"
HEADERS = {
    "ngrok-skip-browser-warning": "1",
    "X-User-Id": "lucas",
    "Content-Type": "application/json"
}

endpoints = [
    ("GET", "/api/v1/music/home?mood=all"),
    ("GET", "/api/v1/music/search?q=muri"),
    ("GET", "/api/v1/music/search?q=Jorge+Vercillo"),
    ("GET", "/api/v1/music/genres"),
    ("GET", "/api/v1/music/library?filter=all&view=list"),
    ("GET", "/api/v1/music/liked"),
    ("GET", "/api/v1/music/playlists"),
    ("GET", "/api/v1/music/search/history?limit=5"),
    ("GET", "/api/v1/music/search/suggestions?q=jorge"),
]

print(f"=== TESTANDO ENDPOINTS DE MÚSICA EM: {BASE_URL} ===\n")

for method, path in endpoints:
    url = f"{BASE_URL}{path}"
    try:
        if method == "GET":
            res = requests.get(url, headers=HEADERS, timeout=15)
        else:
            res = requests.post(url, headers=HEADERS, timeout=15)
        
        status = res.status_code
        data = res.json() if res.headers.get("content-type", "").startswith("application/json") else res.text[:100]
        
        if status == 200:
            if isinstance(data, dict):
                keys = list(data.keys())
                print(f"[OK 200] {path} -> Chaves: {keys}")
                # Detalhes específicos
                if "tracks" in data:
                    print(f"       -> {len(data['tracks'])} faixas encontradas")
                if "trending_brasil" in data:
                    print(f"       -> {len(data.get('trending_brasil', []))} trending faixas")
                if "genres" in data:
                    print(f"       -> {len(data.get('genres', []))} generos")
            elif isinstance(data, list):
                print(f"[OK 200] {path} -> Array com {len(data)} itens")
            else:
                print(f"[OK 200] {path} -> {str(data)[:60]}")
        else:
            print(f"[ERRO {status}] {path} -> {res.text[:150]}")
    except Exception as e:
        print(f"[FALHA] {path} -> {e}")

print("\n=== TESTE CONCLUIDO ===")
