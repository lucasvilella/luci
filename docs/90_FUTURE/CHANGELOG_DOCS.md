---
Title: Documentation Changelog
Category: Future
Status: Living Document
Version: 1.0
Owner: Lucas Vilella
Summary: Histórico de mudanças estruturais aplicadas à documentação da Luci, incluindo a consolidação de duplicatas feita em 2026-07-26.

Related Documents:
- DECISIONS_LOG.md
- DOCUMENTATION_RULES.md
---

# DOCUMENTATION CHANGELOG

Este documento registra mudanças estruturais na documentação em si (não na arquitetura da plataforma — para isso, ver `DECISIONS_LOG.md`).

---

## 2026-07-26 — Consolidação estrutural

**Arquivos removidos por duplicidade:**

- `03_COGNITIVE_ENGINES/TOOL_ENGINE.md` — conteúdo único (Tool Health, Plugin Architecture) absorvido por `05_INTELLIGENCE/TOOL_ENGINE.md`, que ficou como versão canônica por já estar mais conectado ao restante do ecossistema (`TOOL_REGISTRY.md`, `TOOL_EXECUTION.md`, `TASK_COORDINATOR.md`).
- `08_PLATFORM/IDENTITY_AND_WORKSPACES.md` — conteúdo único (Workspace Resolution, Workspace Switching, Guest Workspace operacional) absorvido por `02_CORES/WORKSPACE_CORE.md`. A versão de `00_CORE_FOUNDATION/IDENTITY_AND_WORKSPACES.md` ficou como canônica.
- `00_CORE_FOUNDATION/NAMING.md` — conteúdo único (nome oficial da plataforma, categorias Brain/Core/Layer/Workspace) absorvido por `99_RULES/NAMING_CONVENTIONS.md`, que ficou como versão canônica por refletir a estrutura de pastas real do repositório.

**Arquivos criados:**

- `01_ARCHITECTURE/OBSERVABILITY.md` — documento citado por 4 outros arquivos mas que nunca havia sido escrito.
- `90_FUTURE/DECISIONS_LOG.md` — registro de decisões arquiteturais (ADR), prática adotada a partir da ideia #7 de `ARCHITECTURE_EVOLUTION.md`.
- `90_FUTURE/CHANGELOG_DOCS.md` — este arquivo.

**Referências corrigidas:**

Catorze referências cruzadas apontavam para documentos inexistentes (renomeados ou nunca criados). Todas foram corrigidas ou redirecionadas para o documento equivalente mais próximo. Ver lista completa na conversa original de revisão.

**Vocabulário consolidado:**

`GLOSSARY.md` passou a incluir Capability, Provider, Registry, Package, Session, License e Feature Flag — termos que já eram usados extensivamente a partir de `03_COGNITIVE_ENGINES` em diante, mas nunca haviam sido formalmente definidos.

**Formatação para leitura por IA (Antigravity):**

Todo documento passou a incluir um campo `Summary:` no frontmatter — um resumo de uma a duas frases extraído da seção Objetivo de cada arquivo — para que um agente consiga triar rapidamente qual documento abrir sem precisar ler o conteúdo inteiro.

---

Fim do Documento.
