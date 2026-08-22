---
Title: Module Communication
Category: Architecture
Status: Official
Version: 1.0
Owner: Lucas Vilella

Related Documents:
- SYSTEM_ARCHITECTURE.md
- COGNITIVE_LOOP.md
- COGNITIVE_PIPELINE.md
- COGNITIVE_BUS.md
- API_CONTRACTS.md
Summary: Este documento define como os componentes internos da Luci se comunicam.
---

# MODULE COMMUNICATION

> *"Módulos não conhecem módulos. Eles conhecem responsabilidades."*

---

# Objetivo

Este documento define como os componentes internos da Luci se comunicam.

A arquitetura foi projetada para minimizar acoplamento, permitir evolução contínua e facilitar escalabilidade.

Nenhum componente deve depender diretamente da implementação de outro componente.

Todos dependem apenas de contratos.

---

# Filosofia

A inteligência emerge da colaboração entre componentes independentes.

Cada módulo possui uma única responsabilidade.

A comunicação deve ser:

- previsível;
- observável;
- rastreável;
- desacoplada;
- orientada a domínio.

---

# Princípio Fundamental

Nenhum componente pode assumir conhecimento interno de outro componente.

Os módulos comunicam apenas:

- eventos;
- comandos;
- consultas;
- contratos.

Nunca através de acesso direto ao estado interno.

---

# Camadas de Comunicação

Toda comunicação ocorre através de quatro mecanismos.

```
Commands

↓

Queries

↓

Events

↓

Responses
```

Cada mecanismo possui um propósito específico.

---

# Commands

Commands representam intenção.

São utilizados quando um componente deseja solicitar uma ação.

Características.

- possuem destino conhecido;
- possuem um único responsável;
- alteram estado;
- são síncronos ou assíncronos.

Exemplos.

```
CreateMemory

ExecuteAutomation

GenerateResponse

UpdateGoal

StoreKnowledge
```

---

# Queries

Queries representam leitura.

Nunca alteram estado.

Exemplos.

```
GetWorkspace

FindIdentity

SearchKnowledge

ResolvePermissions

ListGoals
```

Queries sempre retornam dados.

Nunca produzem efeitos colaterais.

---

# Events

Eventos representam fatos já ocorridos.

Ninguém envia um evento esperando resposta.

Eventos apenas informam.

Exemplos.

```
ConversationStarted

MemoryCreated

GoalCompleted

ToolExecuted

WorkspaceDestroyed

IdentityResolved
```

Múltiplos componentes podem reagir ao mesmo evento.

---

# Responses

Representam o resultado de um Command ou Query.

Sempre retornam objetos estruturados.

Nunca retornam texto livre entre módulos internos.

---

# Comunicação Entre Cores

Os Cores não devem conversar diretamente entre si.

Exemplo incorreto.

```
Memory Core

↓

Knowledge Core
```

Exemplo correto.

```
Memory Core

↓

Event

↓

Orchestrator

↓

Knowledge Core
```

Os Cores permanecem independentes.

---

# Comunicação Entre Engines

Engines podem colaborar.

Sempre através do Orchestrator.

```
Planning Engine

↓

Decision Engine

↓

Conversation Engine
```

Nunca existe chamada circular.

---

# Comunicação Entre Managers

Managers coordenam recursos.

Managers nunca executam lógica cognitiva.

Exemplos.

Workspace Manager

↓

Plugin Manager

↓

Cache Manager

↓

Session Manager

---

# Comunicação Entre Interfaces

Interfaces nunca conversam diretamente com Engines.

Toda comunicação passa pelo Orchestrator.

```
Desktop

↓

Orchestrator

↓

Mega Brain
```

O mesmo vale para:

- Telegram;
- Mobile;
- Tablet;
- Watch;
- API.

---

# Comunicação Com Integrações

Toda integração externa passa obrigatoriamente pelo Tool Engine.

```
Reasoning Engine

↓

Decision Engine

↓

Tool Engine

↓

Google Calendar
```

Nenhum Engine acessa APIs externas diretamente.

---

# Comunicação Com Modelos de IA

Todos os modelos são acessados através do LLM Gateway.

```
Reasoning Engine

↓

LLM Gateway

↓

Gemini

Claude

GPT

Llama

Qwen

Gemma
```

Os Engines nunca conhecem provedores específicos.

---

# Contratos

Todo módulo expõe apenas contratos públicos.

Nunca detalhes internos.

Exemplo.

```
IdentityCore.resolve()

WorkspaceManager.build()

ToolEngine.execute()

MemoryCore.store()
```

A implementação pode mudar.

O contrato permanece.

---

# Comunicação Assíncrona

Sempre que possível utilizar eventos.

Exemplos.

```
MemoryCreated

↓

Learning Engine

↓

Knowledge Core

↓

Observability
```

Nenhum desses componentes conhece os demais.

---

# Comunicação Síncrona

Utilizar apenas quando o resultado for necessário imediatamente.

Exemplo.

```
Decision Engine

↓

Permission Resolver

↓

Resultado
```

---

# Dependências Permitidas

```
Interfaces

↓

Orchestrator

↓

Managers

↓

Engines

↓

Cores

↓

Infrastructure
```

Fluxo descendente.

---

Dependências ascendentes são proibidas.

---

# Dependências Proibidas

Exemplos.

```
Memory Core

↓

Conversation Engine
```

```
Knowledge Core

↓

Telegram
```

```
Desktop

↓

Reasoning Engine
```

```
Conversation Engine

↓

Supabase
```

Essas dependências quebram o isolamento arquitetural.

---

# Ciclo Oficial

```
Interface

↓

Orchestrator

↓

Workspace Manager

↓

Engines

↓

Decision

↓

Tool Engine

↓

Events

↓

Memory

↓

Learning

↓

Knowledge

↓

Response
```

---

# Escalabilidade

Novos módulos podem ser adicionados sem alterar módulos existentes.

Exemplo.

```
Emotion Engine
```

Basta registrar:

- contratos;
- eventos;
- capacidades.

Nenhum outro componente precisa ser modificado.

---

# Observabilidade

Toda comunicação gera metadados.

Exemplos.

- CCID;
- timestamp;
- origem;
- destino;
- duração;
- status;
- erros;
- eventos produzidos.

Isso permite rastrear completamente qualquer ciclo cognitivo.

---

# Princípios

Toda comunicação deve seguir as seguintes regras.

- comunicar intenção, nunca implementação;
- depender de contratos;
- preferir eventos;
- evitar acoplamento;
- preservar isolamento;
- permitir paralelismo;
- ser completamente observável.

---

# Definição

A comunicação entre módulos da Luci é baseada em contratos, comandos, consultas e eventos.

Cada componente conhece apenas as responsabilidades públicas dos demais, permitindo que a plataforma evolua continuamente sem criar dependências rígidas ou comprometer sua arquitetura cognitiva.

---

> **"A inteligência cresce quando os módulos cooperam. A arquitetura permanece saudável quando eles permanecem independentes."**

---

Fim do Documento.