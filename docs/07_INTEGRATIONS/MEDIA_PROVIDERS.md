---
Title: Media Providers Integration
Category: Integrations
Status: Official
Version: 1.0
Owner: Lucas Vilella

Related Documents:
- INTEGRATION_ARCHITECTURE.md
- TOOL_ENGINE.md
- TOOL_REGISTRY.md
- MUSIC.md
- MOVIES_SERIES.md
Summary: A integração Media Providers conecta a Luci a fontes externas de metadata e de mídia (áudio e vídeo), oferecendo uma camada plugável e substituível usada pelos módulos Música e Filmes e Séries.
---

# MEDIA PROVIDERS

> *"O provedor sabe onde está o arquivo. A Luci sabe por que ele importa."*

---

# Objetivo

A integração Media Providers conecta a Luci a fontes externas de metadata (título, artista, sinopse, capa, classificação) e de mídia reproduzível (áudio, vídeo), usadas pelos módulos `MUSIC.md` e `MOVIES_SERIES.md`.

Seu papel é abstrair completamente a origem técnica do conteúdo — biblioteca local, fonte gratuita de teste, ou futura API paga — para que nenhuma delas influencie a inteligência de recomendação, que pertence exclusivamente à Luci.

---

# Filosofia

Um provedor de mídia entrega dados.

Nunca decide o que recomendar.

Nunca aprende com o comportamento do usuário.

Nunca sabe quem está ouvindo ou assistindo.

Essa é a aplicação direta do Non-Negotiable 6 (Providers nunca implementam lógica cognitiva) ao domínio de conteúdo audiovisual.

---

# Princípio Fundamental

```
Media Intelligence
  (parte da Luci — Music.md ou Movies_Series.md)

↓

Tool Engine

↓

Media Providers Integration

↓

Metadata Provider     Media Source Provider
  (busca/enriquece)      (resolve stream/arquivo)
```

A Media Intelligence nunca chama um Provider diretamente — sempre através do Tool Engine, como qualquer outra Capability.

---

# Responsabilidades

A integração Media Providers é responsável por:

- registrar Metadata Providers e Media Source Providers disponíveis no Tool Registry;
- padronizar o formato de resposta de qualquer Provider (título, artista/elenco, capa, duração, classificação, IDs externos);
- aplicar fallback automático entre Providers de metadata quando o primário não retornar resultado;
- resolver o stream/arquivo reproduzível a partir do Media Source Provider selecionado;
- reportar disponibilidade e saúde de cada Provider ao Tool Registry.

---

# O que NÃO é responsabilidade

A integração Media Providers nunca:

- decide o que recomendar — isso pertence à Media Intelligence dentro de `MUSIC.md`/`MOVIES_SERIES.md`;
- armazena perfil de gosto ou histórico de consumo — isso pertence ao Personal Workspace de cada Identity, via Memory Core;
- expõe diretamente ao usuário qual Provider respondeu a uma busca.

---

# Tipos de Provider

## Metadata Provider

Responsável por identificar e enriquecer conteúdo: título, artista/elenco, álbum/temporada, capa, gênero, classificação indicativa, relações.

Exemplos de implementação: catálogo de biblioteca local, MusicBrainz/ListenBrainz, YouTube Music, futuras integrações pagas.

## Media Source Provider

Responsável por resolver o stream ou arquivo reproduzível de uma faixa/título já identificado.

Exemplos de implementação: biblioteca local do servidor, YouTube Music, futuras integrações pagas (Spotify, Tidal, serviços de vídeo).

---

# Fallback entre Providers

```
Metadata Provider primário

↓

Sem resultado ou indisponível

↓

Metadata Provider secundário (fallback)
```

O fallback é automático e nunca exposto ao usuário — a experiência de busca é sempre contínua, independentemente de qual Provider respondeu.

---

# Registro no Tool Registry

Cada Provider é registrado como uma implementação de uma Capability padrão:

```
Capability: Search Metadata / Resolve Media Stream

↓

Implementações:
  - Biblioteca Local
  - MusicBrainz / ListenBrainz
  - YouTube Music
  - (futuro) Spotify
  - (futuro) Tidal
```

Seguindo exatamente o mesmo padrão de mapeamento já usado em `TOOL_REGISTRY.md` para outras Capabilities (ex: Send Notification → Telegram, Email, WhatsApp).

---

# Priorização e Seleção

A seleção de qual Provider usar em cada chamada pode considerar:

- disponibilidade e saúde do Provider (Available, Degraded, Offline);
- cobertura de catálogo esperada para o tipo de busca;
- custo (Providers pagos, quando existirem);
- preferência técnica definida em configuração (ex: priorizar biblioteca local sempre que o título existir localmente).

---

# Relação com o Módulo Música

`MUSIC.md` consome esta integração para resolver metadata e áudio a partir das sementes de recomendação decididas pela Music Intelligence.

---

# Relação com o Módulo Filmes e Séries

`MOVIES_SERIES.md` consome esta integração da mesma forma, para catálogo de vídeo, sinopses e classificação indicativa.

---

# Segurança

- credenciais de Providers pagos futuros são isoladas por Provider, nunca compartilhadas entre módulos;
- nenhuma informação de perfil pessoal (gosto, histórico) é enviada a um Provider externo — apenas o termo de busca necessário.

---

# Observabilidade

São registrados:

- chamadas por Provider;
- taxa de sucesso e latência;
- uso de fallback;
- disponibilidade de cada Provider ao longo do tempo.

---

# Escalabilidade

A arquitetura suporta:

- novos Providers de metadata ou mídia sem alteração estrutural nos módulos que os consomem;
- múltiplos Providers do mesmo tipo operando em paralelo, com prioridade configurável;
- Providers pagos e gratuitos coexistindo.

---

# Evoluções Futuras

A integração foi projetada para suportar:

- benchmarking automático entre Providers (qualidade, velocidade, cobertura de catálogo);
- normalização de loudness e de qualidade de mídia entre fontes diferentes;
- Providers pagos como camada adicional, sem substituir a biblioteca local.

---

# Princípios

A integração Media Providers segue os princípios:

- capacidades antes de implementações;
- fallback automático e transparente;
- nenhuma decisão de recomendação ocorre nesta camada;
- credenciais isoladas por Provider;
- biblioteca local sempre disponível, independente de Providers externos.

---

# Definição

A integração Media Providers representa a camada plugável de fontes externas de metadata e mídia da Luci, utilizada pelos módulos Música e Filmes e Séries, garantindo que nenhuma fonte técnica de conteúdo jamais influencie a inteligência de recomendação da plataforma.

---

> **"Trocar de provedor nunca muda o que a Luci recomenda — só de onde o arquivo vem."**

---

Fim do Documento.
