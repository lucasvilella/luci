---
Title: Prompt Engine
Category: Intelligence
Status: Official
Version: 1.0
Owner: Lucas Vilella

Related Documents:
- CONTEXT_BUILDER.md
- MODEL_ROUTER.md
- MODEL_CAPABILITIES.md
- TOKEN_MANAGER.md
- TOOL_REGISTRY.md
- OUTPUT_PROCESSOR.md
Summary: O Prompt Engine é responsável por transformar o contexto cognitivo produzido pela plataforma em uma especificação de inferência compatível com o modelo selecionado.
---

# PROMPT ENGINE

> *"Os modelos não recebem apenas texto. Recebem instruções cuidadosamente estruturadas."*

---

# Objetivo

O Prompt Engine é responsável por transformar o contexto cognitivo produzido pela plataforma em uma especificação de inferência compatível com o modelo selecionado.

Seu papel é organizar instruções, contexto, objetivos, restrições, ferramentas e formato esperado, produzindo uma representação consistente e otimizada para inferência.

---

# Filosofia

A Luci nunca escreve prompts diretamente.

Ela constrói uma representação estruturada da tarefa.

O prompt é apenas uma possível forma de serializar essa representação.

---

# Princípio Fundamental

A arquitetura produz uma **Inference Specification**.

O Prompt Engine converte essa especificação para o formato esperado pelo modelo.

```
Inference Specification

↓

Serializer

↓

Provider Format

↓

LLM
```

---

# Responsabilidades

O Prompt Engine é responsável por:

- transformar contexto em instruções;
- estruturar objetivos;
- organizar restrições;
- incluir ferramentas disponíveis;
- definir formato de saída;
- adaptar a estrutura ao modelo selecionado.

---

# O que NÃO é responsabilidade

O Prompt Engine nunca:

- escolhe modelos;
- monta contexto;
- executa ferramentas;
- interpreta respostas;
- aprende.

---

# Inference Specification

Toda inferência é composta por:

- objetivo;
- contexto;
- políticas;
- restrições;
- ferramentas disponíveis;
- formato esperado;
- prioridade;
- metadados.

Essa estrutura é independente de qualquer modelo.

---

# Camadas da Especificação

## Objective

O que precisa ser realizado.

---

## Context

Informações relevantes produzidas pelo Context Builder.

---

## Instructions

Regras de comportamento.

Exemplos.

- responder em português;
- utilizar linguagem técnica;
- não inventar informações;
- justificar decisões.

---

## Constraints

Limitações.

Exemplos.

- limite de tamanho;
- formato JSON;
- sem markdown;
- resposta objetiva.

---

## Tool Context

Ferramentas disponíveis durante a inferência.

Inclui:

- nome;
- descrição;
- permissões;
- parâmetros.

---

## Output Contract

Define exatamente como a resposta deve ser produzida.

Exemplos.

- texto;
- JSON;
- tabela;
- lista;
- estrutura tipada.

---

# Serializer

Cada Provider pode exigir formatos diferentes.

O Serializer converte a Inference Specification para:

- mensagens;
- JSON;
- chamadas estruturadas;
- APIs específicas.

A lógica permanece isolada.

---

# Adaptação por Modelo

O Prompt Engine pode adaptar a especificação considerando:

- capacidades;
- limitações;
- melhores práticas;
- recursos exclusivos do modelo.

Sem alterar a lógica da plataforma.

---

# Templates

A arquitetura pode possuir templates reutilizáveis.

Exemplos.

- Conversation;
- Planning;
- Analysis;
- Coding;
- Vision;
- Translation;
- Summarization.

Esses templates são parametrizados.

---

# Tool Awareness

Quando houver ferramentas disponíveis.

A especificação informa:

- quais ferramentas existem;
- quando utilizá-las;
- restrições;
- políticas de uso.

---

# Structured Outputs

Sempre que possível.

O Prompt Engine solicita respostas estruturadas.

Exemplos.

- JSON;
- objetos tipados;
- listas;
- contratos definidos.

Isso reduz ambiguidades.

---

# Relação com o Context Builder

O Context Builder fornece o estado cognitivo.

O Prompt Engine organiza esse estado para inferência.

---

# Relação com o Model Router

O modelo escolhido pode influenciar a serialização.

A lógica cognitiva permanece idêntica.

---

# Relação com o Output Processor

O formato solicitado deve ser compatível com o pós-processamento.

---

# Observabilidade

Cada inferência registra:

- template utilizado;
- tamanho da especificação;
- formato gerado;
- modelo utilizado;
- tempo de serialização.

---

# Segurança

O Prompt Engine respeita:

- políticas do Workspace;
- permissões da Identity;
- classificação das informações;
- restrições de exposição de contexto.

---

# Escalabilidade

A arquitetura suporta:

- novos Providers;
- novos formatos de inferência;
- serializadores específicos;
- modelos multimodais;
- futuras interfaces sem prompts textuais.

---

# Evoluções Futuras

O Prompt Engine foi projetado para suportar:

- DSL própria para inferência;
- instruções multimodais;
- otimização automática por modelo;
- templates aprendidos pelo Learning Engine;
- geração adaptativa baseada em histórico.

---

# Princípios

O Prompt Engine segue os princípios:

- especificação antes de prompt;
- estrutura antes de texto;
- independência de modelos;
- reutilização de templates;
- clareza antes de complexidade;
- compatibilidade futura.

---

# Definição

O Prompt Engine representa o componente responsável por transformar o estado cognitivo da Luci em uma especificação de inferência estruturada e independente de fornecedores, convertendo-a para o formato esperado por cada modelo de Inteligência Artificial sem acoplar a arquitetura às particularidades de qualquer tecnologia.

---

> **"Prompts são apenas uma linguagem. A intenção da Luci é muito maior do que isso."**

---

Fim do Documento.