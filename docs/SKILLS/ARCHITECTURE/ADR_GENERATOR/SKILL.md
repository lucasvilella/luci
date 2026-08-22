---
name: ADR Generator
description: >
  Gera Architecture Decision Records (ADR) documentando decisões arquiteturais,
  alternativas consideradas, justificativas e impactos para preservar a memória
  técnica da plataforma.

version: 1.0
owner: Lucas
project: Luci
architecture: Cognitive Operating System

requires:
  - Architecture Guardian
  - Documentation Generator

triggers:
  - criar adr
  - architecture decision
  - decision record
  - documentar decisão
  - registrar decisão
  - adr
---

# ADR Generator

## Objetivo

Documentar decisões arquiteturais relevantes da Luci

Toda decisão importante deve possuir contexto, justificativa e consequências claramente registradas.

---

# Consulte sempre

Antes de responder, considere obrigatoriamente:

- docs/99_RULES/ARCHITECTURAL_PRINCIPLES.md
- docs/99_RULES/NON_NEGOTIABLES.md
- docs/ARCHITECTURE_EVOLUTION.md

---

# Processo

## 1. Identifique a decisão

Determine claramente:

- qual decisão foi tomada;
- qual problema motivou a decisão.

---

## 2. Contextualize

Explique:

- cenário;
- limitações;
- requisitos;
- impactos.

---

## 3. Liste alternativas

Sempre documente:

- alternativas avaliadas;
- vantagens;
- desvantagens.

---

## 4. Registre a decisão

Explique:

- solução escolhida;
- justificativa técnica;
- alinhamento com a arquitetura.

---

## 5. Avalie impactos

Descreva:

- impactos positivos;
- limitações;
- riscos;
- consequências futuras.

---

## 6. Relacione documentos

Sempre informe:

- documentos afetados;
- componentes envolvidos;
- regras relacionadas.

---

# Estrutura recomendada

Sempre produzir:

### Título

### Status

### Contexto

### Problema

### Alternativas

### Decisão

### Justificativa

### Impactos

### Documentos Relacionados

---

# Nunca faça

- registrar decisões sem contexto;
- omitir alternativas;
- justificar decisões apenas por preferência pessoal;
- contrariar os Non-Negotiables.

---

# Resultado esperado

Todo ADR deve:

- preservar a memória arquitetural;
- explicar claramente a decisão;
- justificar tecnicamente a escolha;
- servir como referência para futuras evoluções da plataforma.