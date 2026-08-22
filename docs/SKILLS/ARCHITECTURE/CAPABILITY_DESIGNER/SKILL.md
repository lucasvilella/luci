---
name: Capability Designer
description: >
  Projeta novas Capabilities para a L.U.C.I. identificando responsabilidades,
  contratos, eventos, permissões, integrações e impactos arquiteturais antes da implementação.

version: 1.0
owner: Lucas
project: L.U.C.I.
architecture: Cognitive Operating System

requires:
  - Architecture Guardian

triggers:
  - criar capability
  - nova capability
  - adicionar funcionalidade
  - novo recurso
  - nova feature
  - capability
  - feature design
  - architecture design
---

# Capability Designer

## Objetivo

Projetar novas Capabilities respeitando integralmente a arquitetura da L.U.C.I.

Esta Skill define a arquitetura da funcionalidade antes da implementação.

Nunca comece pelo código.

Sempre comece pelo desenho da Capability.

---

# Consulte sempre

Antes de responder, considere obrigatoriamente:

- docs/01_ARCHITECTURE/CAPABILITY_SYSTEM.md
- docs/99_RULES/ARCHITECTURAL_PRINCIPLES.md
- docs/99_RULES/DESIGN_RULES.md
- docs/99_RULES/NON_NEGOTIABLES.md
- docs/99_RULES/NAMING_CONVENTIONS.md

---

# Processo

## 1. Entenda o objetivo

Identifique claramente:

- Qual problema será resolvido?
- Quem utilizará essa Capability?
- Ela representa uma nova capacidade ou uma composição de capacidades existentes?

Sempre priorize reutilização.

---

## 2. Defina a responsabilidade

Toda Capability deve possuir uma única responsabilidade.

Caso existam múltiplas responsabilidades, proponha múltiplas Capabilities.

---

## 3. Identifique dependências

Liste:

- Engines envolvidos
- Providers necessários
- Plugins opcionais
- Interfaces consumidoras

---

## 4. Defina contratos

Especifique:

- entradas
- saídas
- eventos produzidos
- eventos consumidos

Nunca exponha implementações.

---

## 5. Avalie impacto

Informe:

- impacto na memória
- impacto no contexto
- impacto em permissões
- impacto em observabilidade

---

## 6. Segurança

Verifique:

- permissões necessárias
- isolamento
- acesso à memória
- acesso a Providers

---

## 7. Observabilidade

Defina:

- métricas
- logs
- eventos
- auditoria

---

## 8. Resultado

Sempre entregue:

### Nome da Capability

### Objetivo

### Responsabilidade

### Entradas

### Saídas

### Eventos

### Dependências

### Permissões

### Observabilidade

### Componentes relacionados

### Recomendações de implementação

---

# Nunca faça

- criar lógica cognitiva dentro da Capability;
- acoplar diretamente Engines;
- acessar memória diretamente;
- duplicar responsabilidades;
- expor implementações concretas.

---

# Resultado esperado

Toda Capability deve:

- representar uma única responsabilidade;
- ser reutilizável;
- ser desacoplada;
- possuir contratos claros;
- integrar-se naturalmente à arquitetura da L.U.C.I.;
- estar pronta para implementação pelos Engines e Providers apropriados.