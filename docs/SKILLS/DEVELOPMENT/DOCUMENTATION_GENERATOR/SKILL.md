---
name: Documentation Generator
description: >
  Gera documentação técnica seguindo rigorosamente o padrão oficial da Luci
  Deve ser utilizada para criar novos documentos, atualizar documentação existente
  ou documentar componentes da arquitetura.

version: 1.0
owner: Lucas
project: Luci
architecture: Cognitive Operating System

requires:
  - Architecture Guardian
  
triggers:
  - documentar
  - criar documentação
  - gerar documentação
  - novo documento
  - documente
  - markdown
  - documentação técnica
  - architecture docs
---

# Documentation Generator

## Objetivo

Gerar documentação consistente com o padrão oficial da Luci

Todo documento deve preservar a identidade arquitetural da plataforma.

Nunca produza documentação fora do padrão estabelecido.

---

# Consulte sempre

Antes de gerar qualquer documento, considere obrigatoriamente:

- docs/99_RULES/DOCUMENTATION_RULES.md
- docs/99_RULES/NAMING_CONVENTIONS.md
- docs/99_RULES/ARCHITECTURAL_PRINCIPLES.md
- docs/99_RULES/NON_NEGOTIABLES.md

---

# Processo

## 1. Identifique

Determine o tipo de documento.

Exemplos:

- Core
- Engine
- Provider
- Interface
- Platform
- Package
- Plugin
- Rule
- Capability
- Architecture
- Configuration

---

## 2. Defina a estrutura

Sempre utilize Front Matter.

Exemplo:

- Title
- Category
- Status
- Version
- Owner
- Related Documents

---

## 3. Estruture o documento

Sempre que aplicável, utilize esta sequência:

- Objetivo
- Filosofia
- Responsabilidades
- Não Responsabilidades
- Fluxo
- Componentes Envolvidos
- Observabilidade
- Segurança
- Evolução
- Princípios
- Definição

Nem todos os documentos exigem todas as seções.

Inclua apenas as relevantes.

---

## 4. Linguagem

Utilize:

- Inglês para nomes arquiteturais.
- Português para explicações.

Nunca misture nomenclaturas.

Sempre utilize o Vocabulário Oficial.

---

## 5. Responsabilidades

Explique claramente:

- O que faz.
- Por que existe.
- Como participa da arquitetura.
- Quais componentes utiliza.
- Quais componentes não deve substituir.

---

## 6. Diagramas

Quando agregarem valor, utilize diagramas simples em Markdown.

Preferencialmente:

- ASCII
- Mermaid

Nunca substitua explicações por diagramas.

---

## 7. Relacionamentos

Sempre informe documentos relacionados.

Utilize referências cruzadas.

Evite duplicação de conteúdo.

---

## 8. Encerramento

Todo documento deve conter:

- Definição
- Citação filosófica
- "Fim do Documento."

---

# Nunca faça

- Duplicar conteúdo existente.
- Criar documentação inconsistente.
- Alterar a estrutura oficial.
- Inventar novos termos arquiteturais.
- Omitir responsabilidades.
- Escrever documentação dependente de linguagem de programação.

---

# Resultado esperado

Toda documentação gerada deve:

- seguir exatamente o padrão da Luci;
- ser consistente com a arquitetura;
- utilizar o vocabulário oficial;
- estar pronta para inclusão na pasta docs;
- parecer escrita pelo mesmo autor da documentação existente.

A documentação deve priorizar clareza, consistência e longevidade.