---
Title: Event Router
Category: Orchestration
Status: Official
Version: 1.0
Owner: Lucas Vilella

Related Documents:
- ORCHESTRATOR.md
- COGNITIVE_BUS.md
- COGNITIVE_CYCLE.md
- ENGINE_SCHEDULER.md
- OBSERVABILITY.md
- API_CONTRACTS.md
Summary: O Event Router é responsável por distribuir todos os eventos produzidos durante a execução da plataforma para os componentes interessados.
---

# EVENT ROUTER

> *"Eventos carregam informação. O Event Router garante que ela chegue ao lugar certo."*

---

# Objetivo

O Event Router é responsável por distribuir todos os eventos produzidos durante a execução da plataforma para os componentes interessados.

Ele conecta produtores e consumidores de eventos sem criar dependências diretas entre eles, preservando o desacoplamento da arquitetura.

O Event Router nunca interpreta a lógica do evento.

Ele apenas determina seu destino.

---

# Filosofia

Na arquitetura da L.U.C.I., componentes nunca conversam diretamente entre si.

Eles apenas publicam eventos.

Da mesma forma, componentes nunca conhecem quem produzirá um evento.

Eles apenas declaram interesse em determinados tipos de eventos.

Essa separação elimina acoplamento, facilita evolução da plataforma e permite escalabilidade praticamente ilimitada.

---

# Princípio Fundamental

Todo componente publica eventos.

Todo componente consome eventos.

Nenhum componente conhece outro componente.

```
Producer

↓

Event

↓

Cognitive Bus

↓

Event Router

↓

Consumers
```

---

# Responsabilidades

O Event Router é responsável por:

- receber eventos do Cognitive Bus;
- identificar consumidores interessados;
- distribuir eventos;
- permitir múltiplos consumidores;
- aplicar filtros de entrega;
- preservar rastreabilidade;
- garantir isolamento entre componentes.

---

# O que NÃO é responsabilidade

O Event Router nunca:

- interpreta intenções;
- executa lógica de negócio;
- altera estados;
- executa Engines;
- aprende;
- conversa com usuários;
- executa ferramentas.

Ele apenas distribui eventos.

---

# Fluxo de Funcionamento

Todo fluxo segue a mesma sequência.

```
Engine

↓

Publish Event

↓

Cognitive Bus

↓

Event Router

↓

Consumers
```

O Router nunca modifica o conteúdo do evento.

---

# Event Registry

Todos os eventos existentes na plataforma são registrados.

Cada registro contém:

- Event ID;
- Nome;
- Categoria;
- Produtor;
- Payload esperado;
- Versão;
- Consumidores registrados.

Esse registro permite descoberta automática de consumidores.

---

# Event Categories

Eventos são organizados por domínio.

Exemplos.

```
Intent

Reasoning

Decision

Planning

Execution

Conversation

Learning

Workflow

Security

System

Infrastructure
```

Novas categorias podem ser adicionadas sem alterar a arquitetura.

---

# Event Structure

Todo evento segue um contrato único.

```
Event ID

Correlation ID

Session ID

Cycle ID

Workspace ID

Identity ID

Timestamp

Category

Type

Payload

Metadata

Version
```

Isso garante rastreabilidade completa.

---

# Capability-Based Routing

O Event Router nunca conhece implementações concretas.

Ele roteia eventos para capacidades.

Exemplo.

```
IntentCompleted

↓

Capability

Reasoning

↓

Capability Registry

↓

Reasoning Engine
```

Caso futuramente existam múltiplas implementações da mesma capacidade, nenhuma alteração será necessária no Router.

---

# Consumer Registration

Cada componente declara explicitamente quais eventos deseja consumir.

Exemplo.

Conversation Engine.

```
ExecutionCompleted

ConversationRequested
```

Learning Engine.

```
CycleCompleted

ExecutionCompleted

DecisionCompleted
```

Workflow Manager.

```
TaskCompleted

CycleCompleted

PlanningCompleted
```

O Router apenas consulta esse registro.

---

# Broadcast

Um único evento pode ser entregue simultaneamente para diversos consumidores.

Exemplo.

```
ToolExecuted

↓

Conversation Engine

↓

Learning Engine

↓

Workflow Manager

↓

Observability

↓

Metrics
```

Cada consumidor recebe uma cópia independente do evento.

---

# Point-to-Point Delivery

Alguns eventos possuem apenas um consumidor.

Exemplo.

```
ReasoningRequested

↓

Reasoning Engine
```

O Event Router suporta ambos os modelos.

---

# Filtering

Consumidores podem registrar filtros.

Exemplo.

```
Learning Engine

↓

Receber apenas

ExecutionCompleted
DecisionCompleted
CycleCompleted
```

Isso reduz processamento desnecessário.

---

# Ordering

Eventos pertencentes ao mesmo Cognitive Cycle preservam ordem de entrega.

Exemplo.

```
IntentCompleted

↓

ReasoningCompleted

↓

DecisionCompleted

↓

PlanningCompleted

↓

ExecutionCompleted
```

Essa garantia existe apenas dentro do mesmo Cycle.

Cycles independentes podem executar em paralelo.

---

# Parallel Delivery

Quando não existe dependência entre consumidores.

A entrega ocorre simultaneamente.

```
CycleCompleted

↓

Conversation

Learning

Observability

Analytics

Workflow
```

Isso reduz latência.

---

# Delivery Guarantees

O Router garante:

- preservação do Correlation ID;
- preservação do Session ID;
- preservação do Cycle ID;
- preservação do Workspace;
- preservação da Identity;
- entrega ordenada por Cycle;
- isolamento entre consumidores.

---

# Failure Isolation

Falhas de um consumidor nunca impedem os demais.

Exemplo.

```
Learning Engine

↓

Erro
```

Conversation Engine continua normalmente.

Workflow continua normalmente.

Observability continua normalmente.

Cada falha é isolada.

---

# Retry

Eventos não entregues podem seguir políticas configuráveis.

Exemplos.

- retry imediato;
- retry exponencial;
- dead-letter queue;
- encaminhamento ao Failure Recovery.

---

# Dead Letter Queue

Quando um evento não pode ser entregue após todas as tentativas.

Ele é encaminhado para uma fila de análise.

Essa fila pode ser utilizada para:

- auditoria;
- diagnóstico;
- reprocessamento;
- recuperação manual.

---

# Relação com o Orchestrator

O Orchestrator supervisiona o fluxo cognitivo.

O Event Router apenas realiza a distribuição dos eventos.

---

# Relação com o Cognitive Bus

O Cognitive Bus transporta eventos.

O Event Router decide seus destinos.

São componentes independentes.

---

# Relação com os Engines

Os Engines:

- publicam eventos;
- consomem eventos.

Eles nunca conhecem diretamente outros Engines.

---

# Observabilidade

Todo evento registra:

- origem;
- destino;
- timestamp;
- latência;
- consumidores;
- tentativas;
- falhas;
- tempo de entrega;
- resultado da distribuição.

Toda distribuição pode ser reconstruída posteriormente.

---

# Segurança

Todo evento preserva:

- contexto;
- Workspace;
- Identity;
- permissões;
- auditoria.

O Router nunca altera permissões.

---

# Escalabilidade

A arquitetura suporta:

- múltiplos Event Routers;
- filas distribuídas;
- roteamento entre servidores;
- múltiplos nós de processamento;
- Edge Computing;
- processamento híbrido Local + Cloud.

Nenhuma alteração é necessária na arquitetura cognitiva.

---

# Evoluções Futuras

O Event Router foi projetado para suportar:

- descoberta dinâmica de consumidores;
- múltiplas implementações da mesma Capability;
- execução distribuída;
- balanceamento automático;
- roteamento inteligente baseado em contexto;
- versionamento de eventos;
- marketplace de componentes cognitivos.

---

# Princípios

O Event Router segue os princípios:

- componentes nunca se conhecem;
- eventos são imutáveis;
- capacidades antes de implementações;
- múltiplos consumidores são nativos;
- falhas são isoladas;
- rastreabilidade completa;
- desacoplamento absoluto.

---

# Definição

O Event Router representa o componente responsável por distribuir eventos cognitivos através da plataforma, conectando produtores e consumidores de forma totalmente desacoplada. Ele garante rastreabilidade, isolamento, escalabilidade e comunicação orientada a eventos, preservando a independência entre todos os componentes da arquitetura da L.U.C.I.

---

> **"Os componentes nunca precisam saber quem ouvirá suas mensagens. Basta publicá-las."**

---

Fim do Documento.