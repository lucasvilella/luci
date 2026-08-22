---
name: Project Scaffolder
description: >
  Gera automaticamente a estrutura arquitetural completa de novos módulos,
  Engines, Providers, Plugins, Packages ou componentes da L.U.C.I.,
  seguindo todos os padrões oficiais da plataforma.

version: 1.0
owner: Lucas
project: L.U.C.I.
architecture: Cognitive Operating System

requires:
  - Architecture Guardian
  - Capability Designer
  - Documentation Generator

triggers:
  - scaffold
  - scaffolding
  - criar projeto
  - criar módulo
  - gerar estrutura
  - novo componente
  - novo package
  - nova feature
---

# Project Scaffolder

## Objetivo

Gerar automaticamente toda a estrutura inicial de um novo componente da L.U.C.I.

Esta Skill reduz trabalho repetitivo e garante padronização arquitetural.

Nunca gere apenas código.

Sempre gere a estrutura completa.

---

# Consulte sempre

Antes de responder, considere obrigatoriamente:

- docs/99_RULES/ARCHITECTURAL_PRINCIPLES.md
- docs/99_RULES/DESIGN_RULES.md
- docs/99_RULES/NON_NEGOTIABLES.md
- docs/99_RULES/NAMING_CONVENTIONS.md
- docs/99_RULES/CODING_STANDARDS.md

---

# Processo

## 1. Identifique

Determine o tipo de componente.

Exemplos:

- Engine
- Provider
- Plugin
- Package
- Capability
- Interface
- Core Module

---

## 2. Gere a estrutura

Crie a organização de diretórios recomendada.

Inclua somente os elementos necessários para aquele tipo de componente.

---

## 3. Gere os artefatos

Sempre que aplicável, gerar:

- estrutura de pastas;
- interfaces;
- contratos;
- eventos;
- configuração;
- documentação;
- testes;
- health checks;
- métricas;
- logs.

---

## 4. Documentação

Gerar automaticamente o documento correspondente utilizando a Documentation Generator.

---

## 5. Observabilidade

Todo componente deve nascer preparado para:

- logs;
- métricas;
- tracing;
- auditoria.

---

## 6. Segurança

Aplicar automaticamente:

- princípio do menor privilégio;
- isolamento;
- configuração externa;
- uso de contratos públicos.

---

## 7. Checklist

Ao final apresentar:

- estrutura criada;
- documentos gerados;
- contratos definidos;
- eventos definidos;
- próximos passos.

---

# Nunca faça

- gerar componentes fora da arquitetura;
- criar dependências circulares;
- ignorar observabilidade;
- gerar código sem documentação;
- criar estruturas incompatíveis com os padrões da L.U.C.I.

---

# Resultado esperado

Todo scaffold deve:

- seguir exatamente a arquitetura oficial;
- estar pronto para implementação;
- possuir documentação inicial;
- possuir configuração;
- possuir observabilidade;
- respeitar Naming Conventions;
- respeitar todos os Non-Negotiables.

O resultado deve reduzir o tempo de criação de novos componentes e garantir consistência arquitetural desde o primeiro commit.