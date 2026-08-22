# BOOT

> **Luci Boot Sequence**
>
> Este documento representa o ponto de entrada oficial para qualquer agente de IA que participe do desenvolvimento da plataforma Luci
>
> Nenhuma implementação deve ser realizada antes da conclusão desta sequência de inicialização.

---

# Objetivo

A documentação da Luci foi construída em camadas.

Ela deve ser carregada na ordem correta para preservar o contexto arquitetural.

Este documento define essa ordem.

Todo agente deve considerar esta sequência obrigatória.

---

# Princípio Fundamental

A documentação da Luci é a fonte oficial de conhecimento do projeto.

Caso exista conflito entre:

- conhecimento prévio do modelo;
- exemplos encontrados externamente;
- frameworks;
- bibliotecas;
- boas práticas genéricas;

sempre prevalece a documentação da Luci

---

# Sequência de Inicialização

## Etapa 1 — Carregar o Orquestrador

Leia completamente:

```text
docs/SKILLS/MASTER_ORCHESTRATOR/SKILL.md
```

Esta Skill determina quais outras Skills deverão ser utilizadas para cada solicitação.

Nenhuma Skill deve ser carregada antes dela.

---

## Etapa 2 — Carregar as Skills Necessárias

O Master Orchestrator deverá identificar quais Skills serão utilizadas.

As Skills disponíveis são:

```text
docs/SKILLS/

Architecture Guardian

Documentation Generator

Capability Designer

Engine Generator

Provider Generator

Plugin Generator

Project Scaffolder

Code Reviewer

Security Reviewer

ADR Generator
```

Carregue apenas as Skills necessárias para a solicitação atual.

Nunca carregue Skills desnecessárias.

---

## Etapa 3 — Compreender a Arquitetura

Leia toda a documentação exatamente nesta ordem.

Cada pasta depende conceitualmente da anterior.

```text
00_CORE_FOUNDATION

↓

01_ARCHITECTURE

↓

02_CORES

↓

03_COGNITIVE_ENGINES

↓

04_ORCHESTRATION

↓

05_INTELLIGENCE

↓

06_INTERFACES

↓

07_PROVIDERS

↓

08_PLATFORM

↓

99_RULES

↓

ARCHITECTURE_EVOLUTION.md
```

Nunca altere essa sequência.

---

## Etapa 4 — Internalizar os Princípios

Após concluir a leitura considere obrigatórios:

- Architectural Principles
- Design Rules
- Coding Standards
- Naming Conventions
- Security Rules
- AI Behavior Rules
- Non-Negotiables

Esses documentos possuem prioridade absoluta.

---

## Etapa 5 — Classificar a Solicitação

Antes de produzir qualquer resposta determine:

A solicitação envolve:

- arquitetura;
- documentação;
- implementação;
- Engine;
- Provider;
- Plugin;
- Capability;
- Interface;
- revisão;
- segurança;
- decisão arquitetural;
- scaffold.

Identifique quais componentes serão impactados.

---

## Etapa 6 — Executar o Pipeline

Utilize o Master Orchestrator para determinar o pipeline correto de Skills.

Nunca execute Skills desnecessárias.

Nunca ignore uma Skill obrigatória.

Sempre respeite as dependências entre Skills.

---

## Etapa 7 — Validar

Antes da implementação confirme internamente:

✓ Arquitetura

✓ Responsabilidades

✓ Contratos

✓ Segurança

✓ Observabilidade

✓ Organização

✓ Naming

✓ Non-Negotiables

Caso exista qualquer violação:

Interrompa a implementação.

Explique o problema.

Proponha uma alternativa arquitetural.

---

## Etapa 8 — Implementar

Somente após concluir todas as etapas anteriores:

- gerar código;
- gerar documentação;
- gerar testes;
- gerar contratos;
- gerar configurações;
- gerar estruturas.

Toda implementação deve ser consistente com a arquitetura oficial da plataforma.

---

# Regras Gerais

Sempre:

- preservar a arquitetura;
- preservar a documentação;
- preservar os contratos;
- preservar o vocabulário oficial;
- preservar a separação de responsabilidades.

Nunca:

- inventar arquitetura;
- criar dependências circulares;
- duplicar responsabilidades;
- violar os Non-Negotiables;
- utilizar padrões externos que contrariem a documentação oficial.

---

# Filosofia

A Luci não é apenas um projeto de software.

Ela é um sistema arquitetural documentado.

O papel do agente de IA não é apenas gerar código.

Seu papel é preservar a integridade dessa arquitetura durante toda a evolução da plataforma.

Sempre pense como o arquiteto da plataforma antes de agir como um programador.

---

**Fim do Documento.**