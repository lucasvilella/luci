---
Title: Music Module
Category: Modules
Status: Official
Version: 1.0
Owner: Lucas Vilella

Related Documents:
- TOOL_ENGINE.md
- TOOL_REGISTRY.md
- MEDIA_PROVIDERS.md
- LEARNING_ENGINE.md
- MEMORY_CORE.md
- IDENTITY_AND_WORKSPACES.md
- PERMISSIONS.md
- ORB_CHAT.md
Summary: O módulo Música transforma a Luci em um serviço de streaming pessoal com biblioteca local e fontes externas plugáveis, cujas recomendações nascem exclusivamente da inteligência da Luci — nunca de um provedor externo.
---

# MUSIC MODULE

> *"O provedor entrega o áudio. A Luci decide o que vale a pena tocar."*

---

# Objetivo

O módulo Música oferece uma experiência equivalente a um serviço de streaming pessoal — biblioteca local somada a fontes externas gratuitas ou pagas — na qual toda recomendação, playlist e curadoria nasce do cérebro único da Luci, aprendendo com o comportamento real de cada pessoa.

---

# Filosofia

Um provedor de música integra.

Nunca interpreta.

Nunca decide.

Nunca aprende.

Essa é a aplicação direta do Non-Negotiable 6 ao domínio musical: YT Music, uma biblioteca local, ou uma futura API paga (Spotify, Tidal) são todos igualmente substituíveis — nenhum deles pode se tornar o motivo pelo qual uma recomendação existe.

---

# Princípio Fundamental

```
Goal
  ("quero algo pra relaxar", "toca minhas favoritas", ou nenhum pedido — Home)

↓

Music Intelligence
  (parte do Decision Engine + Learning Engine, lê o Personal Workspace ativo)

↓

Metadata Provider
  (fonte primária + fallback — ex: MusicBrainz/ListenBrainz primário, YT Music fallback)

↓

Audio Source Provider
  (ex: YT Music, biblioteca local, futuras fontes pagas)

↓

Tool Engine

↓

Playback Session
  (estado headless, sincronizado por WebSocket entre dispositivos)
```

Nenhuma dessas camadas decide sozinha o que recomendar — apenas a Music Intelligence, que faz parte do cérebro único.

---

# Responsabilidades

O módulo Música é responsável por:

- manter e indexar a biblioteca local de áudio armazenada no servidor;
- abstrair fontes externas de metadata e de áudio através de Providers plugáveis;
- gerar recomendações (Home, Daily Mix, Rádio a partir de uma faixa) a partir do perfil de gosto de cada Personal Workspace;
- registrar sinais de escuta (completou, pulou cedo, curtiu, repetiu, adicionou à playlist) como evidência para o Learning Engine;
- manter uma sessão de reprodução headless, sincronizada entre todos os dispositivos da mesma Identity;
- aplicar políticas de conteúdo por perfil (ver `PERMISSIONS.md`).

---

# O que NÃO é responsabilidade

O módulo Música nunca:

- decide recomendações dentro de um Provider — um Provider apenas busca e entrega o que a Music Intelligence já decidiu buscar;
- mistura o perfil de gosto de dois Workspaces diferentes numa mesma recomendação;
- expõe diretamente ao usuário qual Provider respondeu a uma busca — isso é detalhe de implementação, não de experiência.

---

# Personalização por Workspace

Cada Personal Workspace mantém seu próprio perfil de gosto — histórico de escuta, faixas curtidas, artistas recorrentes.

```
Lucas pergunta "toca algo pra mim"

↓

Workspace Lucas

↓

Perfil de gosto do Lucas
```

```
Ana pergunta "toca algo pra mim"

↓

Workspace Ana

↓

Perfil de gosto da Ana
```

A tela Home do módulo Música nunca é genérica — ela é sempre montada a partir da Identity ativa no Workspace atual, nunca de um "usuário logado no app" tratado de forma indiferenciada.

---

# Conteúdo Compartilhado

Nem toda música pertence a uma pessoa.

```
Playlist da festa de sábado    → Workspace Casa
Trilha sonora de um projeto    → Workspace do Projeto correspondente
Favoritas do Lucas             → Workspace Lucas
```

Quando um dispositivo compartilhado (ex: caixa de som da sala) recebe um comando sem identidade clara, ele usa o repertório do Workspace Casa como padrão, nunca o perfil pessoal de alguém específico.

---

# Perfis com Restrição de Conteúdo

Identities com `profile_type: child` (ver `PERMISSIONS.md`) recebem:

- filtro de conteúdo explícito aplicado antes da recomendação chegar à tela;
- impossibilidade de alterar playlists compartilhadas do Workspace Casa;
- histórico de escuta próprio, isolado do perfil de gosto dos adultos da casa.

---

# Providers (Fontes Plugáveis)

## Metadata Provider

Responsável por título, artista, álbum, capa, gênero, relações.

Pode haver mais de um, com ordem de prioridade e fallback automático caso o primário não retorne resultado.

## Audio Source Provider

Responsável por resolver o stream/arquivo de áudio reproduzível.

Inclui, sem se limitar a: biblioteca local do servidor, fontes externas gratuitas para teste, e futuras integrações pagas.

Trocar de Provider nunca altera o comportamento de recomendação — apenas a origem técnica do áudio.

---

# Relação com Automação Residencial

Um comando de voz como "toca isso na sala" aciona, além da Capability de reprodução, a Capability do módulo Automação Residencial responsável por rotear o áudio ao dispositivo/ambiente físico correto.

---

# Relação com Orb/Chat

Toda interação por voz ou texto relacionada a música ("toca", "pula", "cria uma playlist com...") é resolvida pelo Intent Engine do módulo Orb/Chat e despachada como Capability para este módulo. A tela dedicada de Música permanece disponível para navegação visual direta.

---

# Segurança

- sinais de escuta e histórico nunca vazam entre Workspaces;
- perfil infantil não pode promover conteúdo além do filtro definido para seu `profile_type`;
- alteração de playlists compartilhadas do Workspace Casa respeita a política de permissão daquele Workspace.

---

# Observabilidade

Toda recomendação registra:

- Workspace/Identity de origem;
- sementes utilizadas para a curadoria;
- Provider de metadata e de áudio que responderam;
- sinais de escuta gerados a partir da reprodução.

---

# Evoluções Futuras

O módulo foi projetado para suportar, sem alteração estrutural:

- integração paga com serviços de streaming estabelecidos (Spotify, Tidal) como Audio Source Provider adicional;
- normalização de loudness padronizada entre faixas de fontes diferentes;
- estações de rádio ao vivo como capability complementar à reprodução sob demanda;
- reconhecimento de música ambiente (ouvir e identificar o que está tocando ao redor).

---

# Princípios

O módulo Música segue os princípios:

- a recomendação pertence ao cérebro, nunca ao Provider;
- o gosto pertence ao Workspace pessoal, nunca ao aplicativo;
- Providers de metadata e de áudio são independentes e substituíveis;
- conteúdo compartilhado e conteúdo pessoal nunca se confundem;
- perfis restritos têm política de conteúdo aplicada antes da recomendação, nunca depois.

---

# Definição

O módulo Música representa a experiência de streaming pessoal da Luci, unificando biblioteca local e fontes externas plugáveis sob uma única inteligência de recomendação, que aprende com o comportamento real de cada Identity dentro do seu Personal Workspace.

---

> **"Duas pessoas na mesma casa. Duas playlists diferentes. Um único cérebro por trás das duas."**

---

Fim do Documento.
