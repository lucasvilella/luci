---
Title: Movies & Series Module
Category: Modules
Status: Official
Version: 1.0
Owner: Lucas Vilella

Related Documents:
- MUSIC.md
- TOOL_ENGINE.md
- MEDIA_PROVIDERS.md
- LEARNING_ENGINE.md
- MEMORY_CORE.md
- IDENTITY_AND_WORKSPACES.md
- PERMISSIONS.md
- ORB_CHAT.md
Summary: O módulo Filmes e Séries oferece uma experiência equivalente a um serviço de streaming pessoal de vídeo, com biblioteca local e fontes plugáveis, seguindo os mesmos princípios de personalização e Providers do módulo Música.
---

# MOVIES & SERIES MODULE

> *"A prateleira é local. As sugestões são da Luci."*

---

# Objetivo

O módulo Filmes e Séries oferece uma experiência equivalente a um serviço de streaming pessoal de vídeo — biblioteca local somada a fontes externas plugáveis — na qual toda recomendação e organização de conteúdo (continuar assistindo, sugestões, listas) nasce do cérebro único da Luci.

Este módulo segue a mesma arquitetura de Providers plugáveis e personalização por Workspace descrita em `MUSIC.md`, aplicada a conteúdo audiovisual.

---

# Filosofia

Assim como no módulo Música, nenhum Provider de conteúdo audiovisual decide o que recomendar.

Um Provider entrega catálogo e stream.

A Luci decide o que sugerir, com base no perfil de cada pessoa.

---

# Princípio Fundamental

```
Goal
  ("quero assistir algo leve", "continuar a série", ou nenhum pedido — Home)

↓

Media Intelligence
  (parte do Decision Engine + Learning Engine, lê o Personal Workspace ativo)

↓

Metadata Provider
  (catálogo, sinopse, capa, classificação indicativa, elenco)

↓

Media Source Provider
  (biblioteca local do servidor; futuras fontes pagas)

↓

Tool Engine

↓

Playback Session
  (estado headless, sincronizado por WebSocket entre dispositivos)
```

---

# Responsabilidades

O módulo Filmes e Séries é responsável por:

- manter e indexar a biblioteca local de vídeo armazenada no servidor;
- abstrair fontes externas de metadata e de mídia através de Providers plugáveis;
- gerar recomendações e listas ("Continuar Assistindo", "Sugestões para você", "Noite em Família") a partir do perfil de cada Personal Workspace;
- registrar sinais de consumo (assistiu completo, abandonou, favoritou, reassistiu) como evidência para o Learning Engine;
- manter progresso de reprodução por pessoa, mesmo em títulos assistidos em conjunto;
- aplicar classificação indicativa e políticas de conteúdo por perfil (ver `PERMISSIONS.md`).

---

# O que NÃO é responsabilidade

O módulo Filmes e Séries nunca:

- decide recomendações dentro de um Provider;
- ignora classificação indicativa para qualquer perfil com restrição de conteúdo ativa;
- mistura progresso de reprodução de duas Identities diferentes no mesmo título, exceto quando assistido explicitamente em modo compartilhado (ver Watch Party abaixo).

---

# Personalização por Workspace

Cada Personal Workspace mantém seu próprio:

- progresso de reprodução por título;
- histórico de títulos assistidos;
- preferências de gênero aprendidas;
- lista de favoritos.

```
Lucas retoma uma série

↓

Workspace Lucas

↓

Progresso salvo do Lucas naquele título
```

---

# Conteúdo Compartilhado — Watch Party

Quando um título é assistido em conjunto (ex: TV da sala, mais de uma Identity presente), o progresso é salvo no Workspace Casa como uma sessão compartilhada — nenhuma das Identities individuais tem seu progresso pessoal sobrescrito por essa sessão.

```
"Noite em Família" iniciado

↓

Workspace Casa

↓

Progresso da sessão compartilhada, independente do progresso pessoal de cada um
```

---

# Perfis com Restrição de Conteúdo (Controle Parental)

Este é o módulo onde a classificação indicativa tem maior peso prático. Identities com `profile_type: child` (ver `PERMISSIONS.md`) recebem:

- catálogo filtrado por classificação indicativa máxima permitida, definida no perfil;
- impossibilidade de assistir ou pesquisar títulos fora do limite, mesmo que estejam na biblioteca compartilhada;
- limite de tempo de tela, quando configurado, aplicado antes do início da reprodução;
- histórico de consumo próprio, visível aos responsáveis pelo Workspace Casa mediante a política de divulgação definida.

---

# Providers (Fontes Plugáveis)

## Metadata Provider

Título, sinopse, elenco, capa, classificação indicativa, temporadas/episódios.

## Media Source Provider

Resolve o stream/arquivo reproduzível. Prioriza a biblioteca local do servidor; fontes externas plugáveis (gratuitas para teste, pagas no futuro) seguem o mesmo contrato de Provider usado no módulo Música.

---

# Relação com Orb/Chat

Comandos como "continua a série", "o que tem de comédia?", "quanto falta desse episódio?" são resolvidos pelo Intent Engine do módulo Orb/Chat e despachados como Capability para este módulo.

---

# Segurança

- classificação indicativa é validada antes da exibição, nunca depois;
- progresso e histórico nunca vazam entre Workspaces, exceto nas sessões compartilhadas explícitas (Watch Party);
- alteração de listas compartilhadas do Workspace Casa respeita a política de permissão daquele Workspace.

---

# Observabilidade

Toda recomendação e sessão de reprodução registra:

- Workspace/Identity de origem (ou Workspace Casa, se compartilhada);
- classificação indicativa aplicada;
- Provider de metadata e de mídia que responderam;
- sinais de consumo gerados a partir da sessão.

---

# Evoluções Futuras

O módulo foi projetado para suportar, sem alteração estrutural:

- integração paga com serviços de streaming estabelecidos como Media Source Provider adicional;
- legendas e dublagem geradas ou ajustadas pela própria Luci;
- recomendações cruzadas com o módulo Música (ex: trilha sonora de um filme assistido recentemente).

---

# Princípios

O módulo Filmes e Séries segue os princípios:

- a recomendação pertence ao cérebro, nunca ao Provider;
- classificação indicativa é uma barreira antes da exibição, não um aviso depois;
- progresso pessoal e progresso compartilhado nunca se confundem, exceto quando explicitamente combinados numa sessão em grupo;
- Providers de metadata e de mídia são independentes e substituíveis.

---

# Definição

O módulo Filmes e Séries representa a experiência de streaming pessoal de vídeo da Luci, unificando biblioteca local e fontes externas plugáveis sob uma única inteligência de recomendação, com controle de conteúdo por perfil e progresso individual preservado mesmo em sessões assistidas em família.

---

> **"A mesma TV. Perfis diferentes. Cada um retoma de onde parou."**

---

Fim do Documento.
