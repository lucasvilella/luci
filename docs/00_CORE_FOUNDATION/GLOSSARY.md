---
Title: Glossary
Category: Core Foundation
Status: Official
Version: 1.0
Owner: Lucas Vilella

Related Documents:
- MANIFESTO.md
- PHILOSOPHY.md
- CORE_PRINCIPLES.md
- SYSTEM_CONTEXT.md
- DOMAIN_MODEL.md
- COGNITIVE_MODEL.md
- IDENTITY_AND_WORKSPACES.md
- NAMING_CONVENTIONS.md
Summary: Este documento define o significado oficial dos termos utilizados na documentação da L.U.C.I.
---

# GLOSSARY

> *"Uma arquitetura consistente começa por uma linguagem consistente."*

---

# Objetivo

Este documento define o significado oficial dos termos utilizados na documentação da L.U.C.I.

Todo documento técnico deve utilizar estes termos exatamente como definidos aqui.

Evite criar sinônimos.

Evite renomear conceitos.

A consistência da linguagem faz parte da arquitetura.

---

# A

## Action

Uma operação que será executada pela L.U.C.I.

Pode envolver resposta, automação, uso de ferramentas ou qualquer efeito externo.

---

## Agent

Entidade capaz de executar tarefas em nome do Mega Brain.

Um Agent nunca possui inteligência própria.

Ele executa decisões.

---

## Artifact

Qualquer objeto persistente produzido pelo sistema.

Exemplos:

- Documento
- Plano
- Tarefa
- Decisão
- Nota
- Relatório

---

## Attention

Conjunto limitado de informações consideradas relevantes durante o raciocínio atual.

A atenção representa o foco cognitivo do sistema.

---

# B

## Brain

A inteligência central da L.U.C.I.

Existe apenas um.

Toda decisão nasce nele.

Nenhum dispositivo possui seu próprio Brain.

---

# C

## Capability

Uma capacidade operacional que a plataforma pode executar (ex.: `SendMessage`, `SearchKnowledge`, `Light.On`).

Uma Capability é abstrata: pode possuir uma ou várias implementações concretas (Providers), que o Tool Engine seleciona em tempo de execução.

Este termo pertence ao vocabulário da camada de execução (ver `TOOL_ENGINE.md`, `TOOL_REGISTRY.md`) e é usado extensivamente a partir de `03_COGNITIVE_ENGINES` em diante.

---

## Cognitive Loop

Fluxo contínuo de funcionamento da inteligência.

Percepção.

↓

Identidade.

↓

Contexto.

↓

Planejamento.

↓

Raciocínio.

↓

Execução.

↓

Aprendizado.

↓

Consolidação.

É o coração operacional da plataforma.

---

## Context

Conjunto de informações relevantes para compreender uma situação específica.

O contexto é temporário e dinâmico.

---

## Conversation

Uma interação entre uma identidade e a L.U.C.I.

Nem toda conversa gera memória.

Nem toda conversa gera conhecimento.

---

## Core

Componente responsável por um domínio permanente do sistema.

Exemplos:

Identity Core

Knowledge Core

Memory Core

Context Core

---

# D

## Decision

Resultado do processo de raciocínio.

Uma decisão pode ser:

Responder.

Executar.

Perguntar.

Pesquisar.

Esperar.

Não agir.

---

## Device

Qualquer ponto de acesso ao Mega Brain.

Exemplos:

Celular.

Tablet.

Desktop.

Watch.

Smart Display.

O Device nunca contém inteligência.

---

## Domain

Área de conhecimento da arquitetura.

Exemplos:

Identity.

Knowledge.

Memory.

Conversation.

Automation.

---

# E

## Engine

Motor especializado responsável por executar uma capacidade específica.

Exemplos:

Conversation Engine.

Tool Engine.

Reasoning Engine.

Planning Engine.

Learning Engine.

Um Engine executa.

Não decide.

---

## Entity

A unidade fundamental do Knowledge Graph.

Tudo que existe para a L.U.C.I. é uma Entity.

---

## Event

Representação de um acontecimento.

Eventos conectam componentes da plataforma.

---

# G

## Goal

Resultado desejado por uma identidade ou Workspace.

Pode possuir prioridade, prazo e progresso.

---

## Guest

Identidade temporária com acesso limitado.

Por padrão não possui memória persistente.

---

# I

## Identity

Representa quem está interagindo com a plataforma.

Uma Identity pode representar:

Pessoa.

Empresa.

Pet.

Organização.

Dispositivo.

Agente.

---

## Integration

Qualquer sistema externo conectado à L.U.C.I.

Exemplos:

Telegram.

GitHub.

Google Calendar.

Home Assistant.

Supabase.

---

# K

## Knowledge

Conjunto de fatos consolidados.

Conhecimento não depende da conversa.

Conhecimento representa aquilo que o sistema considera verdadeiro.

---

## Knowledge Graph

Estrutura que conecta todas as entidades e seus relacionamentos.

É a principal fonte de verdade do sistema.

---

# L

## Learning

Processo contínuo de evolução da inteligência.

Aprender não significa apenas armazenar.

Significa melhorar decisões futuras.

---

## License

Autorização de uso associada a um Package, Plugin ou Capability específica.

Não confundir com permissão (ver `PERMISSIONS.md`): licença controla *o que está instalado/disponível*; permissão controla *quem pode usar o que está disponível*.

---

## Feature Flag

Interruptor que ativa ou desativa uma funcionalidade sem exigir nova implantação de código.

Uma Feature Flag nunca contém lógica cognitiva — apenas liga/desliga capacidades já existentes.

---

# M

## Mega Brain

Nome oficial da inteligência central da L.U.C.I.

Existe apenas um Mega Brain.

Todos os dispositivos e Workspaces compartilham esse mesmo cérebro.

---

## Memory

Representação persistente de experiências consideradas relevantes.

Uma memória pode evoluir, enfraquecer ou desaparecer.

---

## Memory Consolidation

Processo responsável por decidir quais experiências se tornam memória permanente.

---

# P

## Perception

Primeira etapa do Cognitive Loop.

Consiste em captar estímulos vindos do ambiente.

---

## Personality

Forma como a inteligência se comunica.

A personalidade nunca altera a capacidade cognitiva.

Ela altera apenas comportamento e linguagem.

---

## Plan

Sequência organizada de decisões para atingir um objetivo.

---

## Plugin

Extensão adicionada ao sistema.

Plugins ampliam capacidades sem alterar a arquitetura.

---

## Package

Agrupamento distribuível de componentes (Capabilities, Plugins, Providers, conhecimento base) instalável na plataforma como uma unidade.

Um Package nunca altera a arquitetura central; ele apenas registra novos componentes nela.

---

## Provider

Implementação concreta de uma Capability (ex.: `GoogleCalendarProvider` implementa a Capability `Calendar.CreateEvent`).

Um Provider nunca decide nem interpreta intenções — ele apenas executa. A escolha entre Providers concorrentes é feita pelo Tool Engine.

---

# R

## Reasoning

Processo de análise utilizado para transformar contexto em decisões.

---

## Relationship

Ligação entre duas entidades do Knowledge Graph.

É a base da inteligência contextual.

---

## Registry

Catálogo que mantém o registro de quais Capabilities existem e quais Providers as implementam (ex.: Tool Registry).

Um Registry nunca executa nada — ele apenas responde "o que existe" e "quem implementa o quê".

---

# S

## Session

Estado operacional de curta duração associado a uma interação em andamento (interface ativa, tarefa em curso, foco atual).

Não confundir com **Cognitive Session** (ver `COGNITIVE_SESSION.md`), que representa um agrupamento de longa duração de ciclos cognitivos em torno de um mesmo objetivo, podendo durar dias, meses ou anos. Session (curta) e Cognitive Session (longa) são conceitos relacionados, mas de escalas de tempo diferentes — sempre que houver ambiguidade, especificar qual dos dois está sendo referido.

---

## Shared Workspace

Workspace utilizado por múltiplas identidades.

Exemplos:

Casa.

Empresa.

Família.

Equipe.

Projeto.

---

## Tool

Capacidade externa utilizada pelo sistema.

A ferramenta executa.

Nunca decide.

---

# W

## Workspace

Contexto Cognitivo Executável carregado pelo Mega Brain durante uma interação.

Um Workspace reúne:

- identidade;
- contexto;
- objetivos;
- memória relevante;
- conhecimento;
- permissões;
- ferramentas disponíveis.

Ele representa a RAM Cognitiva da plataforma.

---

## Workspace Manager

Componente responsável por criar, manter, sincronizar e destruir Workspaces.

---

# Fonte da Verdade

Caso exista divergência entre documentos, este Glossário prevalece.

Toda nova terminologia deverá ser adicionada aqui antes de ser utilizada na documentação oficial.

---

# Definição

O Glossário estabelece a linguagem oficial da L.U.C.I.

Uma linguagem consistente reduz ambiguidades, facilita a evolução da arquitetura e garante que pessoas e inteligências artificiais compartilhem o mesmo entendimento sobre o sistema.

---

> **"Conceitos bem definidos produzem arquiteturas bem construídas."**

---

Fim do Documento.