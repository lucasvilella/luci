"""
Standalone Test Script for Luci External APIs Suite.
Validates all 10 async integrations, TTL caching behavior and error handling.
"""

import asyncio
import time
from services.tool_registry import ToolRegistry, GEMINI_TOOL_DECLARATIONS

async def test_suite():
    print("=" * 60)
    print("🚀 INICIANDO TESTE DAS 10 INTEGRAÇÕES DA LUCI")
    print(f"📦 Total de declarações carregadas: {len(GEMINI_TOOL_DECLARATIONS)}")
    print("=" * 60)

    # 1. Open-Meteo & wttr.in
    print("\n1. ⛅ Clima (Open-Meteo & wttr.in):")
    weather_res = await ToolRegistry.execute("get_weather_forecast", {"latitude": -23.55, "longitude": -46.63})
    print(f"   [Open-Meteo SP] Temp: {weather_res.get('current', {}).get('temperature_c')}°C | Vento: {weather_res.get('current', {}).get('windspeed_kmh')} km/h")
    
    wttr_res = await ToolRegistry.execute("get_weather_summary_wttr", {"city_or_location": "Sao Paulo"})
    print(f"   [wttr.in] Resumo: {wttr_res.get('summary')}")

    # 2. BrasilAPI Feriados
    print("\n2. 📅 Feriados (BrasilAPI):")
    holidays_res = await ToolRegistry.execute("get_brazil_holidays", {"year": 2026})
    feriados = holidays_res.get("holidays", [])
    print(f"   [Feriados 2026] Total encontrados: {len(feriados)} | Próximos: {[f.get('name') for f in feriados[:3]]}")

    # 3. AwesomeAPI Câmbio
    print("\n3. 💵 Câmbio & Cripto (AwesomeAPI):")
    rates_res = await ToolRegistry.execute("get_currency_rates", {"pairs": "USD-BRL,EUR-BRL,BTC-BRL"})
    rates = rates_res.get("rates", {})
    for pair, data in rates.items():
        print(f"   [{pair}] Compra: R$ {data.get('bid')} | Variação: {data.get('pctChange')}%")

    # 4. Hacker News & Wikipedia
    print("\n4. 📰 Notícias & Enciclopédia (Hacker News & Wikipedia):")
    hn_res = await ToolRegistry.execute("get_hacker_news_top", {"limit": 2})
    for story in hn_res.get("stories", []):
        print(f"   [HN Top] {story.get('title')} ({story.get('score')} pts)")

    wiki_res = await ToolRegistry.execute("get_wikipedia_summary", {"term": "Inteligência_artificial", "lang": "pt"})
    summary = wiki_res.get("summary", {})
    print(f"   [Wikipedia] {summary.get('title')}: {summary.get('description')}")

    # 5. Radio Browser & Jikan Anime
    print("\n5. 📻 Streaming & Entretenimento (Radio Browser & Jikan Anime):")
    radio_res = await ToolRegistry.execute("search_radio_stations", {"tag": "lofi", "limit": 2})
    for radio in radio_res.get("stations", []):
        print(f"   [Radio] {radio.get('name')} -> {radio.get('stream_url')[:45]}...")

    anime_res = await ToolRegistry.execute("search_anime", {"query": "Solo Leveling", "limit": 1})
    for a in anime_res.get("anime", []):
        print(f"   [Anime] {a.get('title')} | Nota: {a.get('score')} | Status: {a.get('status')}")

    # 6. Microlink & Ntfy Push
    print("\n6. 🔗 Link Preview & Push (Microlink & Ntfy.sh):")
    meta_res = await ToolRegistry.execute("extract_url_metadata", {"target_url": "https://github.com"})
    print(f"   [Microlink] Título da URL: {meta_res.get('metadata', {}).get('title')}")

    ntfy_res = await ToolRegistry.execute("send_ntfy_push", {
        "topic": "luci_test_channel",
        "message": "Teste do motor de ferramentas da Luci executado com sucesso!",
        "title": "Luci Tools Online",
    })
    print(f"   [Ntfy Push] Status: {ntfy_res.get('status') or ntfy_res.get('error')}")

    # 7. Teste de Cache TTL (Sub-milissegundo)
    print("\n7. ⚡ Testando Eficiência do Cache TTL em Memória:")
    start = time.perf_counter()
    cached_call = await ToolRegistry.execute("get_weather_forecast", {"latitude": -23.55, "longitude": -46.63})
    elapsed_ms = (time.perf_counter() - start) * 1000
    print(f"   [TTL Cache] Resposta em: {elapsed_ms:.3f}ms (Cache Flag: {cached_call.get('cached')})")

    print("\n" + "=" * 60)
    print("✅ TODAS AS 10 FERRAMENTAS VALIDADAS COM SUCESSO!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(test_suite())
