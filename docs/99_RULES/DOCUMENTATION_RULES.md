---
Title: Documentation Rules
Category: Rules
Status: Official
Version: 1.0
Owner: Lucas Vilella

Related Documents:
- ARCHITECTURAL_PRINCIPLES.md
- CODING_STANDARDS.md
- DESIGN_RULES.md
- NAMING_CONVENTIONS.md
Summary: Este documento estabelece os princípios de documentação da Luci
---

# DOCUMENTATION RULES

> *"Código implementa. Documentação preserva conhecimento."*

---

# Objetivo

Este documento estabelece os princípios de documentação da Luci

Seu propósito é garantir que todo conhecimento arquitetural, funcional e técnico permaneça consistente, compreensível e evolutivo ao longo do ciclo de vida da plataforma.

---

# Filosofia

A documentação é parte integrante da arquitetura.

Ela não descreve apenas o sistema.

Ela também orienta sua evolução.

---

# Princípios Gerais

Toda documentação deve ser:

- clara;
- objetiva;
- consistente;
- atualizada;
- rastreável;
- orientada ao domínio.

---

# Estrutura Padrão

Sempre que aplicável, um documento deve conter:

- Objetivo;
- Filosofia;
- Responsabilidades;
- O que NÃO é responsabilidade;
- Fluxo;
- Componentes envolvidos;
- Observabilidade;
- Segurança;
- Evolução futura;
- Princípios;
- Definição.

Nem todos os documentos precisam possuir todas as seções, mas a estrutura deve permanecer previsível.

---

# Fonte da Verdade

Cada assunto deve possuir um único documento oficial.

Evitar duplicação de informações.

Quando necessário, utilizar referências cruzadas para outros documentos.

---

# Atualização

Toda alteração arquitetural relevante deve atualizar a documentação correspondente antes ou junto da implementação.

A documentação nunca deve ficar permanentemente defasada em relação ao sistema.

---

# Linguagem

A documentação técnica utiliza:

- inglês para nomes de componentes, contratos e elementos arquiteturais;
- português para explicações, quando adotado como idioma principal do projeto.

A terminologia deve seguir o Vocabulário Oficial definido em `NAMING_CONVENTIONS.md`.

---

# Clareza

A documentação deve explicar:

- o que é;
- por que existe;
- quando utilizar;
- quando não utilizar;
- como se relaciona com outros componentes.

Evitar descrições excessivamente abstratas ou dependentes de conhecimento implícito.

---

# Exemplos

Sempre que um conceito puder gerar dúvidas, incluir exemplos.

Exemplos devem ilustrar o uso correto, evitando detalhes de implementação específicos de linguagem.

---

# Diagramas

Sempre que possível, representar fluxos e relações por diagramas simples em texto (ASCII) ou Mermaid.

Diagramas devem complementar o texto, nunca substituí-lo.

---

# Referências Cruzadas

Todo documento deve listar os documentos relacionados mais relevantes.

Isso facilita a navegação e reforça a coesão da arquitetura.

---

# Versionamento

Toda documentação deve informar:

- versão;
- status;
- responsável;
- data de revisão (quando aplicável).

Mudanças significativas devem ser registradas em histórico ou sistema de versionamento.

---

# Architecture Decision Records (ADR)

Toda decisão arquitetural relevante — não trivial, difícil de reverter, ou que gerou dúvida real — deve ser registrada como um ADR dentro do arquivo `90_FUTURE/DECISIONS_LOG.md`, contendo:

```
Data
Contexto (qual era o problema?)
Alternativas consideradas
Decisão tomada
Motivo
Impacto em outros documentos
```

Isso substitui a necessidade de um Architecture Review Board formal (ver `ARCHITECTURE_EVOLUTION.md`, item 6) — que não faz sentido para um projeto de uma pessoa só, mas registrar o raciocínio por trás de cada decisão importante continua valendo, especialmente porque parte desta documentação é gerada com apoio de IA e precisa de rastro humano explícito.

---

# Documentação de Componentes

Cada componente arquitetural deve possuir documentação suficiente para responder:

1. Qual problema resolve?
2. Quais responsabilidades possui?
3. Quais responsabilidades não possui?
4. Quais contratos expõe?
5. Quais dependências possui?
6. Como evolui?
7. Como é observado?

---

# O que Evitar

Evitar:

- documentação duplicada;
- exemplos desatualizados;
- descrições vagas;
- detalhes específicos de implementação quando desnecessários;
- documentação sem responsável;
- termos inconsistentes com o Vocabulário Oficial.

---

# Revisão

Antes de publicar um documento, verificar:

- Está alinhado aos princípios arquiteturais?
- Utiliza o vocabulário oficial?
- Possui referências cruzadas?
- Está claro para um novo desenvolvedor?
- Evita redundâncias?
- Explica responsabilidades e limites?

---

# Princípios

A documentação segue os princípios:

- conhecimento centralizado;
- consistência;
- rastreabilidade;
- clareza;
- evolução contínua;
- alinhamento arquitetural.

---

# Definição

As Documentation Rules definem como o conhecimento da Luci deve ser registrado, organizado e mantido. Elas garantem que a documentação permaneça uma fonte confiável de entendimento da arquitetura, preservando decisões, responsabilidades e relações entre os componentes ao longo da evolução da plataforma.

---

> **"Uma arquitetura excepcional deixa de existir quando seu conhecimento se perde. A documentação é a memória permanente da plataforma."**

---

Fim do Documento.