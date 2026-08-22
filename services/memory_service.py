"""
Long-Term Vector Memory Service for Luci Assistant.
Uses local persistent ChromaDB to store and retrieve personal preferences, project facts,
engineering notes, and context with semantic similarity search.
"""

import os
import time
import asyncio
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
import chromadb
from chromadb.config import Settings

STORAGE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "storage", "vector_memory")
os.makedirs(STORAGE_DIR, exist_ok=True)

class MemoryRecord(BaseModel):
    id: str
    chave: str
    conteudo: str
    categoria: str
    timestamp: float
    distancia: Optional[float] = None

class MemoryService:
    def __init__(self, persist_dir: str = STORAGE_DIR):
        self.persist_dir = persist_dir
        self.client = chromadb.PersistentClient(path=self.persist_dir)
        # Coleção principal de memória semântica da Luci
        self.collection = self.client.get_or_create_collection(
            name="luci_long_term_memory",
            metadata={"hnsw:space": "cosine"},
        )

    def _sync_save(self, chave: str, conteudo: str, categoria: str) -> Dict[str, Any]:
        doc_id = f"{categoria}_{chave}_{int(time.time())}"
        self.collection.add(
            ids=[doc_id],
            documents=[conteudo],
            metadatas=[{
                "chave": chave,
                "categoria": categoria,
                "timestamp": time.time(),
            }],
        )
        return {
            "salvo": True,
            "id": doc_id,
            "chave": chave,
            "categoria": categoria,
            "conteudo": conteudo,
            "mensagem": "Memória gravada com sucesso no banco vetorial.",
        }

    async def salvar_memoria(self, chave: str, conteudo: str, categoria: str = "geral") -> Dict[str, Any]:
        """Grava uma memória ou preferência semântica no banco vetorial de forma não-bloqueante."""
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, self._sync_save, chave, conteudo, categoria)

    def _sync_retrieve(self, busca_semantica: str, limite: int = 3, categoria: Optional[str] = None) -> List[Dict[str, Any]]:
        where_filter = {"categoria": categoria} if categoria else None
        results = self.collection.query(
            query_texts=[busca_semantica],
            n_results=min(limite, max(1, self.collection.count() or 1)),
            where=where_filter,
        )

        memories = []
        if results and results["documents"] and results["documents"][0]:
            docs = results["documents"][0]
            metas = results["metadatas"][0] if results["metadatas"] else []
            distances = results["distances"][0] if results["distances"] else []
            ids = results["ids"][0] if results["ids"] else []

            for i, doc in enumerate(docs):
                meta = metas[i] if i < len(metas) else {}
                dist = distances[i] if i < len(distances) else None
                memories.append({
                    "id": ids[i] if i < len(ids) else f"mem_{i}",
                    "chave": meta.get("chave", "sem_chave"),
                    "categoria": meta.get("categoria", "geral"),
                    "conteudo": doc,
                    "similaridade": round(1.0 - dist, 4) if dist is not None else 1.0,
                })
        return memories

    async def recuperar_memoria(self, busca_semantica: str, limite: int = 3, categoria: Optional[str] = None) -> Dict[str, Any]:
        """Faz a busca por proximidade vetorial e retorna os fatos mais relevantes."""
        loop = asyncio.get_running_loop()
        items = await loop.run_in_executor(None, self._sync_retrieve, busca_semantica, limite, categoria)
        return {
            "query": busca_semantica,
            "total_encontrados": len(items),
            "memorias": items,
        }

# Global Memory Singleton
global_memory_service = MemoryService()

async def salvar_memoria_tool(chave: str, conteudo: str, categoria: str = "geral") -> Dict[str, Any]:
    return await global_memory_service.salvar_memoria(chave, conteudo, categoria)

async def recuperar_memoria_tool(busca_semantica: str, limite: int = 3) -> Dict[str, Any]:
    return await global_memory_service.recuperar_memoria(busca_semantica, limite)
