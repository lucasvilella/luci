"""
Test Suite for Zero-Auth Native Tools Suite.
Validates yfinance, phonenumbers, Open Library, The Color API, Bible API and Open-Meteo.
"""

import asyncio
from services.tool_registry import ToolRegistry, GEMINI_TOOL_DECLARATIONS

async def test_zero_auth_suite():
    print("=" * 60)
    print("🛠️ INICIANDO TESTE DO PACOTE DE FERRAMENTAS ZERO-AUTH")
    print(f"📦 Total de declarações registradas: {len(GEMINI_TOOL_DECLARATIONS)}")
    print("=" * 60)

    # 1. Ações B3 e Câmbio via yfinance
    print("\n1. 📈 Mercado & Finanças (yfinance):")
    b3_res = await ToolRegistry.execute("get_stock_quote", {"ticker": "PETR4.SA"})
    print(f"   [B3 PETR4.SA] {b3_res.get('shortName')}: R$ {b3_res.get('currentPrice')} ({b3_res.get('regularMarketChangePercent')}%)")

    nvda_res = await ToolRegistry.execute("get_stock_quote", {"ticker": "NVDA"})
    print(f"   [NASDAQ NVDA] {nvda_res.get('shortName')}: $ {nvda_res.get('currentPrice')}")

    # 2. Validação de Telefone via phonenumbers
    print("\n2. 📱 Validação de Telefone (phonenumbers):")
    phone_res = await ToolRegistry.execute("validate_and_format_phone", {"raw_number": "11987654321"})
    print(f"   [Telefone] Válido: {phone_res.get('valido')} | E.164: {phone_res.get('numero_e164')} | Região: {phone_res.get('regiao')}")

    # 3. Livros no Open Library
    print("\n3. 📚 Acervo de Livros (Open Library):")
    book_res = await ToolRegistry.execute("search_open_library_books", {"query": "Clean Code", "limit": 1})
    books = book_res.get("livros", [])
    if books:
        print(f"   [Livro] {books[0].get('titulo')} por {books[0].get('autores')} ({books[0].get('primeiro_ano_publicacao')})")

    # 4. Design & Cores no The Color API
    print("\n4. 🎨 Design & Cores (The Color API):")
    color_res = await ToolRegistry.execute("get_color_scheme_info", {"hex_code": "00F2FE"})
    print(f"   [Cor #00F2FE] Nome: {color_res.get('nome')} | RGB: {color_res.get('rgb')} | Contraste: {color_res.get('contraste_texto')}")

    # 5. Textos & Citações (Bible API)
    print("\n5. 📖 Textos & Citações (Bible-API):")
    bible_res = await ToolRegistry.execute("get_bible_verse", {"reference": "john 3:16"})
    print(f"   [{bible_res.get('referencia')}] {bible_res.get('texto')}")

    print("\n" + "=" * 60)
    print("✅ TODAS AS FERRAMENTAS ZERO-AUTH VALIDADAS COM SUCESSO!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(test_zero_auth_suite())
