"""
Test Suite for Memory Service (ChromaDB) & Background Scheduler.
"""

import asyncio
from services.memory_service import salvar_memoria_tool, recuperar_memoria_tool
from services.scheduler_service import global_scheduler

async def test_memory_and_scheduler():
    print("=" * 60)
    print("🧠 INICIANDO TESTE DA MEMÓRIA SEMÂNTICA & SCHEDULER")
    print("=" * 60)

    # 1. Salvar Memórias
    print("\n1. 💾 Gravando Memórias Vetoriais...")
    res1 = await salvar_memoria_tool(
        chave="preferencia_design",
        conteudo="O usuário prefere interfaces escuras em tons de preto profundo (#08080A), neon ciano e degradês magenta.",
        categoria="preferencia"
    )
    print(f"   [Salvo 1] {res1.get('chave')} -> {res1.get('mensagem')}")

    res2 = await salvar_memoria_tool(
        chave="projeto_policryl",
        conteudo="O projeto Policryl utiliza moldes de injeção plástica para fabricação B2B com prazo padrão de 15 dias úteis.",
        categoria="engenharia"
    )
    print(f"   [Salvo 2] {res2.get('chave')} -> {res2.get('mensagem')}")

    # 2. Busca Semântica por Proximidade
    print("\n2. 🔍 Testando Busca Semântica por Similaridade...")
    busca1 = await recuperar_memoria_tool(busca_semantica="qual cor e tema o usuario gosta?", limite=2)
    print(f"   [Busca 1] Total encontrados: {busca1.get('total_encontrados')}")
    for m in busca1.get("memorias", []):
        print(f"     -> {m['chave']} (Score: {m['similaridade']}): {m['conteudo'][:65]}...")

    busca2 = await recuperar_memoria_tool(busca_semantica="como funcionam os moldes de plastico da fabrica?", limite=2)
    print(f"\n   [Busca 2] Total encontrados: {busca2.get('total_encontrados')}")
    for m in busca2.get("memorias", []):
        print(f"     -> {m['chave']} (Score: {m['similaridade']}): {m['conteudo'][:65]}...")

    # 3. Testar disparo do Job Matinal
    print("\n3. 🌅 Testando Execução do Job de Briefing Matinal Proativo...")
    await global_scheduler.morning_briefing_job()

    print("\n" + "=" * 60)
    print("✅ TESTE DE MEMÓRIA & SCHEDULER CONCLUÍDO COM SUCESSO!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(test_memory_and_scheduler())
