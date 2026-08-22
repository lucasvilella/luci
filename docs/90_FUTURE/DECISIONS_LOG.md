---
Title: Decisions Log
Category: Future
Status: Living Document
Version: 1.0
Owner: Lucas Vilella

Related Documents:
- DOCUMENTATION_RULES.md
- ARCHITECTURE_EVOLUTION.md
- CHANGELOG_DOCS.md
Summary: Registro cronológico de decisões arquiteturais relevantes (formato ADR), incluindo a consolidação estrutural feita em 2026-07-26.
---

# DECISIONS LOG (ADR)

> Registro cronológico de decisões arquiteturais relevantes, conforme definido em `DOCUMENTATION_RULES.md`.

---

## 2026-07-26 — Consolidação estrutural da documentação

**Contexto:** a revisão completa da documentação identificou dois documentos duplicados (`TOOL_ENGINE.md` em duas pastas, `IDENTITY_AND_WORKSPACES.md` em duas pastas), dois sistemas de convenção de nomes concorrentes (`NAMING.md` vs `NAMING_CONVENTIONS.md`) e catorze referências cruzadas apontando para documentos inexistentes.

**Alternativas consideradas:** (a) manter os dois documentos de cada par e diferenciar por escopo explícito; (b) escolher um de cada par como canônico e absorver o conteúdo único do outro; (c) reescrever ambos do zero.

**Decisão:** opção (b) em todos os casos. Ver `CHANGELOG_DOCS.md` para o detalhamento arquivo a arquivo.

**Motivo:** a própria arquitetura declara como princípio que "cada assunto deve possuir um único documento oficial" (`DOCUMENTATION_RULES.md`, Fonte da Verdade). Manter os dois violaria o próprio princípio que a documentação define.

**Impacto:** `GLOSSARY.md` passou a incluir os termos que só existiam na "segunda geração" da documentação (Capability, Provider, Registry, Package, Session, License, Feature Flag), tornando-se de fato a fonte única de vocabulário.

---

## 2026-07-26 — Critério de adoção das ideias do ARCHITECTURE_EVOLUTION

**Contexto:** `ARCHITECTURE_EVOLUTION.md` continha 40 ideias sem distinção clara entre o que deveria ser adotado agora e o que era aspiracional de longo prazo.

**Decisão:** adotar apenas ideias de baixo custo e alto valor para a fase atual do projeto (documentação, vocabulário, práticas de decisão). Ideias que pressupõem escala, equipe ou orçamento (marketplace, federação, licenciamento, benchmarks contínuos entre modelos) permanecem explicitamente adiadas, cada uma com uma linha de justificativa, em vez de simplesmente ignoradas.

**Motivo:** coerente com o princípio de `CORE_PRINCIPLES.md` #25 (Simplicity Over Complexity) e com o contexto real do projeto — desenvolvimento solo, 5 a 10 horas por semana, sem orçamento de investimento.

**Impacto:** ver seção de status em `ARCHITECTURE_EVOLUTION.md`.

---

Fim do Documento.
