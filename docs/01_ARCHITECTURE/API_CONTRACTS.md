---
Title: API Contracts
Category: Architecture
Status: Official
Version: 1.0
Owner: Lucas Vilella

Related Documents:
- SYSTEM_ARCHITECTURE.md
- COGNITIVE_PIPELINE.md
- COGNITIVE_COMMUNICATION.md
- COGNITIVE_BUS.md
Summary: Este documento define os contratos oficiais utilizados na comunicação da plataforma Luci
---

# API CONTRACTS

> *"A evolução de um sistema depende da estabilidade dos seus contratos, não das suas implementações."*

---

# Objetivo

Este documento define os contratos oficiais utilizados na comunicação da plataforma Luci

Um contrato representa um acordo permanente entre dois componentes.

Os contratos permitem que módulos evoluam independentemente, mantendo compatibilidade entre versões.

Este documento não define implementações específicas (REST, gRPC, WebSocket ou filas).

Ele define apenas a estrutura lógica das mensagens trocadas dentro da plataforma.

---

# Filosofia

Componentes nunca compartilham implementações.

Eles compartilham contratos.

Enquanto um contrato permanecer estável, qualquer implementação pode ser substituída sem impacto para os demais módulos.

---

# Tipos de Contratos

A plataforma utiliza quatro categorias de contratos.

```
Commands

Queries

Events

Responses
```

Cada categoria possui comportamento próprio.

---

# Command Contract

Representa uma solicitação para executar uma ação.

Características.

- possui um destino;
- altera estado;
- pode produzir resposta;
- pode falhar.

Exemplos.

```
CreateMemory

CreateGoal

ExecuteTool

GenerateResponse

UpdateWorkspace

LearnPreference
```

Estrutura.

```
Command

Id

CCID

Workspace

Identity

Payload

Metadata
```

---

# Query Contract

Representa uma solicitação de leitura.

Características.

- nunca altera estado;
- sempre retorna dados;
- pode utilizar cache;
- deve ser idempotente.

Exemplos.

```
GetWorkspace

FindIdentity

SearchKnowledge

ListGoals

RetrieveMemory
```

Estrutura.

```
Query

Id

CCID

Parameters

Metadata
```

---

# Event Contract

Representa um fato consumado.

Características.

- não possui destinatário obrigatório;
- nunca espera resposta;
- pode possuir múltiplos consumidores.

Exemplos.

```
MemoryCreated

GoalCompleted

WorkspaceDestroyed

ReasoningFinished

CycleCompleted
```

Estrutura.

```
Event

Id

CCID

Origin

Timestamp

Payload

Metadata
```

---

# Response Contract

Representa o resultado de Commands e Queries.

Características.

- sempre estruturado;
- nunca retorna texto livre entre módulos;
- pode indicar sucesso parcial.

Estrutura.

```
Response

RequestId

Status

Data

Errors

Metadata
```

---

# Metadata

Todo contrato compartilha metadados comuns.

Campos obrigatórios.

```
CCID

WorkspaceId

IdentityId

Timestamp

Origin

CorrelationId

TraceId

Version
```

Esses campos garantem rastreabilidade completa.

---

# Versionamento

Todo contrato possui versão.

Exemplo.

```
v1

v2

v3
```

Alterações incompatíveis geram nova versão.

Mudanças compatíveis preservam a versão existente.

---

# Compatibilidade

Novos campos podem ser adicionados.

Campos obrigatórios nunca podem ser removidos sem mudança de versão.

Contratos antigos devem permanecer suportados durante o período de migração.

---

# Serialização

Os contratos são independentes do formato de transporte.

Podem ser serializados como.

- JSON
- Protocol Buffers
- MessagePack
- Avro
- CBOR

A escolha depende da infraestrutura.

A estrutura lógica permanece idêntica.

---

# Erros

Todos os erros seguem um contrato único.

Estrutura.

```
Error

Code

Message

Details

Severity

Retryable

Timestamp
```

Exemplo.

```
Code:
IDENTITY_NOT_FOUND

Retryable:
true
```

---

# Idempotência

Commands críticos devem possuir chave de idempotência.

Exemplo.

```
CreateGoal

Idempotency-Key

A8B3-C91F
```

Isso impede duplicações em caso de repetição da requisição.

---

# Contratos Públicos

Interfaces externas utilizam contratos próprios.

Exemplos.

```
Telegram API

REST API

Desktop API

Mobile API

Plugin SDK
```

Esses contratos nunca expõem estruturas internas da plataforma.

---

# Contratos Internos

Os contratos internos são exclusivos da comunicação entre módulos.

Eles não devem ser utilizados diretamente por aplicações externas.

---

# Segurança

Todo contrato deve transportar.

- identidade;
- permissões;
- Workspace;
- escopo;
- classificação de sensibilidade.

Nenhum módulo recebe informações além das necessárias.

---

# Observabilidade

Todo contrato deve permitir rastreamento completo.

Campos obrigatórios.

```
CCID

TraceId

CorrelationId

Latency

Status

Origin

Destination
```

Esses dados alimentam a plataforma de monitoramento.

---

# Evolução

A criação de novos contratos deve seguir os princípios.

- responsabilidade única;
- baixo acoplamento;
- compatibilidade;
- rastreabilidade;
- simplicidade.

Nunca criar contratos específicos para uma única implementação.

---

# Princípios

Todos os contratos seguem as seguintes regras.

- contratos são permanentes;
- implementações são temporárias;
- comunicação é explícita;
- estruturas são tipadas;
- versionamento é obrigatório;
- rastreabilidade é nativa.

---

# Definição

Os API Contracts da Luci estabelecem uma linguagem comum para comunicação entre todos os componentes da plataforma.

Ao separar contratos de implementações, garantem estabilidade arquitetural, evolução contínua e interoperabilidade entre módulos, interfaces e futuras integrações.

---

> **"A arquitetura muda. A tecnologia muda. Os contratos permanecem."**

---

Fim do Documento.