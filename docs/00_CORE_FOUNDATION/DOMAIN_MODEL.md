---
Title: Domain Model
Category: Core Foundation
Status: Official
Version: 1.0
Owner: Lucas Vilella

Related Documents:
- MANIFESTO.md
- PHILOSOPHY.md
- CORE_PRINCIPLES.md
- SYSTEM_CONTEXT.md
- COGNITIVE_MODEL.md
- IDENTITY_AND_WORKSPACES.md
- SYSTEM_ARCHITECTURE.md
Summary: Este documento define o universo conceitual da Luci
---

# DOMAIN MODEL

> *"Toda inteligência precisa compreender o mundo antes de agir sobre ele."*

---

# Objetivo

Este documento define o universo conceitual da Luci

Antes de existir código, APIs ou bancos de dados, existem conceitos.

Esses conceitos representam tudo aquilo que a Luci é capaz de compreender.

O objetivo deste documento é estabelecer uma linguagem comum para toda a arquitetura.

Nenhum componente poderá criar novos conceitos fundamentais sem que este documento seja atualizado.

---

# Filosofia

A Luci não enxerga tabelas.

Não enxerga documentos.

Não enxerga arquivos.

Ela enxerga entidades e relacionamentos.

O conhecimento do sistema é organizado como um grande grafo semântico.

Cada entidade possui identidade própria.

Cada entidade pode possuir memória.

Cada entidade pode possuir contexto.

Cada entidade pode possuir relacionamentos.

---

# Os Grandes Domínios

Todo o conhecimento da Luci pertence a um destes domínios.

```
Identity
Workspace
Knowledge
Memory
Conversation
Planning
Automation
Environment
Execution
Learning
```

Esses domínios são independentes, mas profundamente conectados.

---

# Entity

A Entity é a unidade fundamental do sistema.

Tudo que existe para a Luci é uma entidade.

Exemplos:

- Pessoa
- Casa
- Empresa
- Projeto
- Documento
- Dispositivo
- Ferramenta
- Tarefa
- Evento
- Objetivo
- Workspace

Toda entidade possui identidade própria.

---

## Estrutura Conceitual

Toda Entity possui:

- ID Global
- Tipo
- Nome
- Descrição
- Metadata
- Owner
- Relacionamentos
- Permissões
- Estado
- Timestamp de criação
- Timestamp de atualização

Essa estrutura é lógica.

A implementação poderá variar.

---

# Identity

Identity representa um indivíduo reconhecido pelo sistema.

Uma identidade não é uma conta.

Uma identidade representa qualquer agente capaz de interagir com a plataforma.

Exemplos:

Pessoa

Assistente

Organização

Dispositivo

Agente futuro

---

## Uma Identity possui

Nome

Voice Profile

Relacionamentos

Preferências

Workspace padrão

Histórico

Objetivos

Permissões

---

# Workspace

Workspace representa o ambiente cognitivo ativo.

Ele não é memória.

Ele não é conhecimento.

Ele é contexto organizado.

Tipos:

Personal Workspace

Shared Workspace

Home Workspace

Company Workspace

Project Workspace

Temporary Workspace

Guest Workspace

---

# Conversation

Representa uma interação.

Pode ocorrer por:

voz

chat

API

automação

evento

Uma Conversation nunca representa conhecimento permanente.

Ela é apenas uma experiência.

---

# Memory

Memory representa experiências relevantes.

Uma memória possui:

Importância

Recência

Relacionamentos

Fonte

Confiança

Contexto

Tipo

As memórias podem evoluir.

---

## Tipos

Working Memory

Short-Term Memory

Long-Term Memory

Semantic Memory

Episodic Memory

Procedural Memory

System Memory

---

# Knowledge

Knowledge representa fatos consolidados.

Diferente da memória, conhecimento não depende de quando aconteceu.

Exemplo.

Lucas desenvolve a Luci

Isso é conhecimento.

Não uma conversa.

---

# Goal

Representa algo que uma identidade deseja alcançar.

Exemplos.

Criar a Luci

Aprender inglês.

Comprar uma casa.

Organizar empresa.

Goals possuem prioridade, progresso e dependências.

---

# Project

Agrupa conhecimento relacionado.

Possui:

Objetivos

Documentos

Memórias

Ferramentas

Eventos

Participantes

Todo projeto pertence a um Workspace.

---

# Task

Representa uma ação executável.

Uma tarefa possui:

estado

prioridade

responsável

prazo

dependências

resultado

---

# Tool

Uma Tool representa uma capacidade.

Exemplos:

Telegram

GitHub

Google Calendar

Home Assistant

Supabase

Pesquisa Web

E-mail

A Tool nunca decide.

Ela apenas executa.

---

# Automation

Representa um fluxo automático.

Pode ser iniciado por:

evento

tempo

voz

API

sensor

ou decisão da própria Luci

---

# Device

Representa um ponto de acesso.

Exemplos.

Tablet

Desktop

Celular

Watch

TV

Carro

O Device nunca contém inteligência.

Ele apenas oferece uma interface.

---

# Environment

Representa um ambiente físico ou lógico.

Exemplos.

Casa

Empresa

Apartamento

Servidor

Cloud

Sala

Escritório

Cada ambiente pode conter dispositivos, automações e Workspaces.

---

# Event

Todo acontecimento relevante gera um Event.

Exemplos.

Mensagem recebida.

Usuário chegou em casa.

Documento atualizado.

Luz ligada.

Ferramenta respondeu.

Evento é comunicação.

Não armazenamento.

---

# Decision

Representa uma decisão tomada pelo sistema.

Toda decisão importante pode registrar:

Motivação

Alternativas

Confiança

Resultado

Impacto

---

# Plan

Um plano representa uma sequência organizada de decisões.

Possui:

objetivo

etapas

dependências

estado

prioridade

---

# Relationship

Nenhuma entidade existe isoladamente.

Toda informação relevante deve possuir relacionamentos.

Exemplos.

```
Lucas

↓

Desenvolve

↓

Projeto Luci
```

```
Projeto Luci

↓

Utiliza

↓

GitHub
```

```
Casa

↓

Possui

↓

Tablet
```

Essas conexões produzem inteligência.

---

# Ownership

Toda entidade possui um proprietário lógico.

Pode ser.

Pessoa

Workspace

Empresa

Casa

Sistema

Isso define privacidade.

Não localização física.

---

# Permissions

Toda entidade possui regras de acesso.

Nunca existem permissões globais.

As permissões sempre são avaliadas considerando:

identidade

workspace

contexto

relacionamentos

---

# Lifecycle

Toda entidade percorre um ciclo de vida.

```
Created

↓

Active

↓

Updated

↓

Archived

↓

Deleted
```

Nem todas chegam ao estado final.

---

# O Grafo

A Luci compreende o mundo como um único grafo.

```
Pessoa

↓

Workspace

↓

Projeto

↓

Documento

↓

Memórias

↓

Conhecimento

↓

Objetivos

↓

Ferramentas

↓

Eventos
```

Não existem ilhas de informação.

Tudo pode se relacionar.

---

# Fonte da Verdade

A verdade do sistema nunca será:

uma conversa;

um prompt;

um documento isolado;

uma resposta de IA.

A verdade emerge da combinação entre:

Knowledge

Memory

Relationships

Identity

Workspace

Context

---

# Definição Final

O Domain Model representa o universo que a Luci é capaz de compreender.

Toda funcionalidade futura deverá ser construída utilizando esses conceitos.

Novas implementações podem surgir.

Novas tecnologias podem surgir.

Mas os conceitos fundamentais permanecem estáveis.

---

> **"A inteligência não nasce das informações. Ela nasce das relações entre elas."**

---

Fim do Documento.