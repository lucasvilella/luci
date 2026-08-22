---
Title: Context Builder
Category: Intelligence
Status: Official
Version: 1.0
Owner: Lucas Vilella

Related Documents:
- MODEL_ROUTER.md
- TOKEN_MANAGER.md
- MEMORY_CORE.md
- CONTEXT_CORE.md
- GOAL_CORE.md
- IDENTITY_CORE.md
- WORKSPACE_CORE.md
Summary: O Context Builder é responsável por construir o contexto cognitivo enviado aos modelos de Inteligência Artificial.
---

# CONTEXT BUILDER

> *"A qualidade da inteligência depende da qualidade do contexto que ela recebe."*

---

# Objetivo

O Context Builder é responsável por construir o contexto cognitivo enviado aos modelos de Inteligência Artificial.

Ele reúne informações provenientes dos Cores, da Session, do Cycle, das memórias, dos objetivos, das ferramentas disponíveis e das políticas do Workspace, produzindo uma representação única e consistente para inferência.

O restante da plataforma nunca monta contexto diretamente.

---

# Filosofia

Um modelo não responde apenas a um texto.

Ele responde ao estado cognitivo atual da plataforma.

Quanto melhor esse estado for representado, melhores serão as decisões produzidas.

---

# Princípio Fundamental

O Context Builder transforma o estado interno da Luci em um contexto de inferência.

```
Cores

↓

Context Builder

↓

Inference Context

↓

Model Router

↓

LLM
```

---

# Responsabilidades

O Context Builder é responsável por:

- reunir contexto relevante;
- selecionar informações úteis;
- eliminar redundâncias;
- preservar consistência;
- respeitar limites definidos pelo Token Manager;
- estruturar o contexto para inferência.

---

# O que NÃO é responsabilidade

O Context Builder nunca:

- escolhe modelos;
- conversa com usuários;
- executa ferramentas;
- aprende;
- toma decisões.

Ele apenas organiza informação.

---

# Fontes de Contexto

O contexto pode ser composto por:

- Identity;
- Workspace;
- Session;
- Goal;
- Cognitive Cycle;
- Conversation;
- Context Core;
- Memory Core;
- Knowledge Core;
- Policies;
- Tool Registry;
- Eventos recentes.

---

# Construção Incremental

O contexto é construído em etapas.

```
Identity

↓

Workspace

↓

Session

↓

Goal

↓

Current Cycle

↓

Conversation

↓

Relevant Memories

↓

Knowledge

↓

Available Tools

↓

Policies

↓

Inference Context
```

Cada etapa adiciona apenas informações relevantes.

---

# Seleção de Informação

Nem toda informação disponível deve ser enviada ao modelo.

O Context Builder aplica critérios como:

- relevância;
- atualidade;
- relação com o objetivo;
- dependência do Workflow;
- prioridade;
- limite de contexto.

---

# Context Types

A arquitetura suporta diferentes tipos de contexto.

## Conversational Context

Histórico recente da conversa.

---

## Episodic Context

Experiências relacionadas.

---

## Semantic Context

Conhecimento consolidado.

---

## Operational Context

Estado atual do Workflow, Session e Cycle.

---

## Environmental Context

Workspace, dispositivo, localização lógica, horário, idioma e políticas.

---

# Context Compression

Quando necessário.

O Context Builder reduz contexto utilizando:

- resumos;
- consolidação;
- remoção de redundâncias;
- seleção por relevância.

Toda compressão respeita regras definidas pelo Token Manager.

---

# Context Consistency

O Builder garante que todas as informações enviadas pertençam ao mesmo estado cognitivo.

Não mistura:

- Workspaces;
- Identities;
- Sessions;
- Goals.

---

# Relação com o Memory Core

O Memory Core fornece apenas memórias relevantes para o objetivo atual.

---

# Relação com o Knowledge Core

Conhecimentos permanentes podem complementar o contexto.

---

# Relação com o Goal Core

O objetivo atual sempre faz parte do contexto.

---

# Relação com o Token Manager

O Token Manager informa o orçamento disponível.

O Context Builder decide quais informações incluir.

---

# Relação com o Model Router

Após construir o contexto.

O Builder envia apenas características técnicas ao Router.

O Router seleciona o modelo.

---

# Observabilidade

Cada contexto registra:

- tamanho;
- número de tokens estimado;
- fontes utilizadas;
- memórias incluídas;
- conhecimento incluído;
- compressões realizadas.

---

# Segurança

O Context Builder respeita:

- isolamento entre Workspaces;
- permissões da Identity;
- políticas de privacidade;
- classificação das informações.

Nenhum contexto pode incluir dados não autorizados.

---

# Escalabilidade

A arquitetura suporta:

- contextos multimodais;
- múltiplos modelos;
- contexto híbrido Local + Cloud;
- construção distribuída;
- novos tipos de contexto.

---

# Evoluções Futuras

O Context Builder foi projetado para suportar:

- contexto adaptativo por Capability;
- contexto multimodal completo;
- cache inteligente;
- contexto incremental entre inferências;
- otimização automática baseada em aprendizagem.

---

# Princípios

O Context Builder segue os princípios.

- contexto antes de prompt;
- relevância antes de quantidade;
- consistência antes de completude;
- segurança em primeiro lugar;
- construção incremental;
- independência de modelos.

---

# Definição

O Context Builder representa o componente responsável por transformar o estado cognitivo da Luci em um contexto de inferência consistente, relevante e seguro, reunindo informações provenientes dos diversos Cores e componentes da plataforma para fornecer aos modelos exatamente o conhecimento necessário para cada decisão.

---

> **"Os modelos não recebem apenas palavras. Recebem um estado cognitivo cuidadosamente construído."**

---

Fim do Documento.