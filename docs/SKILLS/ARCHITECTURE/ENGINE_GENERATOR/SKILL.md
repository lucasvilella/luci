---
name: Engine Generator
description: >
  Projeta e gera a estrutura arquitetural de um novo Cognitive Engine para a Luci,
  definindo responsabilidades, contratos, eventos, integrações e observabilidade antes da implementação.

version: 1.0
owner: Lucas
project: Luci
architecture: Cognitive Operating System

requires:
  - Architecture Guardian
  - Capability Designer
  
triggers:
  - criar engine
  - novo engine
  - cognitive engine
  - engine
  - gerar engine
  - criar motor
  - novo módulo cognitivo
---

# Engine Generator

## Objetivo

Projetar um novo Cognitive Engine seguindo rigorosamente a arquitetura oficial da Luci

Todo Engine representa um domínio cognitivo especializado.

Nunca implemente lógica antes de definir claramente sua responsabilidade.

---

# Consulte sempre

Antes de responder, considere obrigatoriamente:

- docs/03_COGNITIVE_ENGINES/
- docs/99_RULES/ARCHITECTURAL_PRINCIPLES.md
- docs/99_RULES/DESIGN_RULES.md
- docs/99_RULES/NON_NEGOTIABLES.md
- docs/99_RULES/NAMING_CONVENTIONS.md
- docs/99_RULES/CODING_STANDARDS.md

---

# Processo

## 1. Identifique o domínio

Determine qual domínio cognitivo será representado.

Exemplos:

- Memory
- Planning
- Learning
- Conversation
- Reasoning
- Vision
- Emotion
- Decision
- Scheduling

Nunca misture múltiplos domínios.

---

## 2. Defina a responsabilidade

Explique claramente:

- Qual problema resolve.
- Quais decisões pertencem ao Engine.
- O que NÃO pertence ao Engine.

Toda responsabilidade deve ser exclusiva.

---

## 3. Defina as entradas

Liste:

- eventos recebidos;
- comandos;
- contexto necessário;
- Capabilities utilizadas.

---

## 4. Defina as saídas

Liste:

- eventos publicados;
- decisões produzidas;
- Capabilities disponibilizadas;
- respostas geradas.

---

## 5. Identifique integrações

Especifique:

- Engines relacionados;
- Providers utilizados;
- Plugins opcionais;
- Interfaces consumidoras.

Nunca crie dependências desnecessárias.

---

## 6. Observabilidade

Defina obrigatoriamente:

- logs;
- métricas;
- eventos;
- auditoria.

Todo Engine deve ser completamente observável.

---

## 7. Segurança

Verifique:

- permissões necessárias;
- acesso ao Context;
- acesso à Memory;
- isolamento arquitetural.

Nenhum Engine deve contornar as regras da plataforma.

---

## 8. Estrutura recomendada

Sempre apresente:

### Nome do Engine

### Objetivo

### Responsabilidades

### Não Responsabilidades

### Entradas

### Saídas

### Eventos

### Capabilities

### Dependências

### Observabilidade

### Segurança

### Componentes relacionados

### Recomendações de implementação

---

# Nunca faça

- misturar múltiplos domínios;
- acessar Providers diretamente quando houver abstrações;
- acessar Memory sem passar pelos contratos definidos;
- implementar lógica pertencente a outro Engine;
- criar dependências circulares;
- tornar o Engine dependente de um modelo específico de IA.

---

# Resultado esperado

Todo Engine gerado deve:

- representar um único domínio cognitivo;
- possuir responsabilidades bem definidas;
- integrar-se naturalmente à arquitetura da Luci;
- respeitar todos os Non-Negotiables;
- ser desacoplado;
- ser observável;
- estar pronto para implementação e documentação.