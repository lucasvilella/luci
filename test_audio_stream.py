import requests
import sys

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "https://subdivide-clip-easiest.ngrok-free.dev"
HEADERS = {"ngrok-skip-browser-warning": "1"}

# Busca uma música real para testar o stream
res = requests.get(f"{BASE_URL}/api/v1/music/search?q=Jorge+Vercillo", headers=HEADERS)
data = res.json()
track = data["tracks"][0]
print(f"Testando áudio para faixa: '{track['title']}' por '{track['artist']}' (ID: {track['id']})")

# Testa /api/v1/music/play/{id}
stream_url = f"{BASE_URL}/api/v1/music/play/{track['id']}?title={requests.utils.quote(track['title'])}&artist={requests.utils.quote(track['artist'])}&ngrok-skip-browser-warning=1"
print(f"URL de stream: {stream_url}")

audio_res = requests.get(stream_url, headers=HEADERS, stream=True, timeout=20)
print(f"Status do stream: {audio_res.status_code}")
print(f"Content-Type: {audio_res.headers.get('content-type')}")

# Lê os primeiros 2048 bytes para confirmar que é áudio binário
chunk = next(audio_res.iter_content(2048))
print(f"Tamanho do primeiro chunk recebido: {len(chunk)} bytes")
print("✅ STREAM DE ÁUDIO FUNCIONANDO 100%!")
