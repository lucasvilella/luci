# Relatório de Análise Técnica dos Projetos — Base para Luci Assistant

Este documento apresenta uma análise técnica minuciosa e estruturada dos 5 projetos/repositórios presentes na pasta `E:\Resources\Repositories_ References\Luci Project`. O objetivo é catalogar todas as funcionalidades prontas, arquiteturas e especificações técnicas para fundamentar o desenvolvimento da nova **Luci Assistant (Assistente Pessoal com Automação)**.

---

## Executive Summary (Resumo dos Projetos)

| Projeto | Tec Stack Principal | Foco Principal | Destaque Reutilizável |
| :--- | :--- | :--- | :--- |
| **OpenJarvis** | Python (>=3.10) + Rust (PyO3) + WebSockets | Framework completo para Personal AI em dispositivos locais | Orquestração ReAct/CodeAct, DSPy/GEPA optimization, 13k+ skills standard, multi-canal (Telegram, Discord, Slack, Whatsapp). |
| **Friday (Tony Stark Demo)** | Python (>=3.11) + FastMCP + LiveKit Agents | Assistente de Voz em Tempo Real estilo Tony Stark | Arquitetura desacoplada (MCP Server SSE + Pipeline de voz LiveKit com STT Sarvam/Whisper e TTS OpenAI/Sarvam). |
| **Jarvis (Local Desktop)** | Python + PyInstaller + Ollama / OpenAI API + MCP | Assistente de Voz 100% Offline com Contexto de Sala | Detecção contínua de voz (Wake word Anywhere, Echo Cancelling, Dictation mode global estilo WisprFlow, Memory Graph & Digest). |
| **Leon 2.0** | Node.js (>=24) + TypeScript + Python Bridges | Plataforma modular de Assistente com Memória por Camadas | Modos de Execução (`smart`, `controlled`, `agent`), Arquitetura `Skills -> Actions -> Tools -> Functions`, UI Aurora. |
| **Ultron Orb UI** | Next.js + Three.js + MediaPipe | Interface visual 3D futurista estilo Holograma com controle gestual | HUD 3D de alta performance com Three.js (post-processing/bloom) e rastreamento de mãos em tempo real via Webcam com MediaPipe. |

---

## 1. OpenJarvis (`OpenJarvis-main`)

### 1.1 Visão Geral e Arquitetura
OpenJarvis é um framework de IA pessoal local-first desenvolvido em Stanford (Hazy Research & Scaling Intelligence Lab). Ele foi projetado para executar no próprio dispositivo com fallbacks inteligentes para a nuvem.
- **Estrutura Core**: Modelo híbrido Python/Rust com PyO3 para aceleração nativa.
- **Tipos de Agentes Embutidos**:
  1. `morning_digest`: Briefing diário agendado (email, calendário, notícias, saúde) com síntese de áudio.
  2. `deep_research`: Pesquisa multi-hop com citações na web e documentos locais.
  3. `monitor_operative`: Monitoramento contínuo de longa duração com memória comprimida e recuperação.
  4. `orchestrator`: Raciocínio multi-turn com seleção automática de ferramentas.
  5. `native_react`: Loop ReAct (Thought-Action-Observation).
  6. `native_openhands`: CodeAct (geração e execução direta de código Python em sandbox).
  7. `operative` & `simple`: Agentes contínuos e single-turn.

### 1.2 Funcionalidades Prontas e Validadas
- **Padrão de Skills `agentskills.io`**: Compatibilidade nativa com catalogação e execução de mais de 13.700 skills da comunidade (Hermes Agent / OpenClaw).
- **Otimização Dinâmica de Skills**: Usa DSPy e GEPA para otimizar prompts e políticas de execução com base no histórico de execução (`trace history`).
- **Suporte Multicanal Embutido**:
  - Telegram, Discord, Slack, WhatsApp (via Baileys bridge), Line, Viber, Messenger, Reddit, Mastodon, XMPP, RocketChat, Zulip, Twitter, Twitch, Nostr, Twilio e Gmail.
- **Sandbox Seguro**: Execução de ferramentas e código isolada em Docker ou Wasmtime (WASM).
- **Motores de Inference Suportados**: Ollama, Apple MLX (`inference-mlx`), vLLM, LiteLLM, Google GenAI, Anthropic e OpenAI.

### 1.3 Especificações Técnicas
- **Requisitos**: Python `>=3.10, <3.14`, Rust toolchain (para extensão nativa).
- **Persistência / Vector DB**: FAISS, ColBERT, BM25, PDF parsing com `pdfplumber`.
- **Áudio & Voz**: `faster-whisper`, Deepgram SDK.

---

## 2. Friday — Tony Stark Demo (`friday-tony-stark-demo-main`)

### 2.1 Visão Geral e Arquitetura
Projeto em Python focado em uma experiência de assistente de voz fluida em tempo real utilizando a arquitetura de **Model Context Protocol (MCP)** via SSE e **LiveKit Agents**.
- **Desacoplamento Inteligente**:
  - `server.py` (`uv run friday`): Servidor FastMCP que expõe ferramentas via SSE na porta 8000.
  - `agent_friday.py` (`uv run friday_voice`): Agente de voz rodando sobre a infraestrutura da LiveKit Cloud.

### 2.2 Funcionalidades Prontas e Validadas
- **Pipeline de Áudio de Baixa Latência**:
  - **STT**: Sarvam Saaras v3 (otimizado para voz/sotaques) ou Whisper.
  - **LLM**: Google Gemini 2.5 Flash ou OpenAI GPT-4o / Groq.
  - **TTS**: OpenAI TTS (`nova` voice) ou Sarvam TTS.
- **Ferramentas MCP Embutidas**:
  - `web.py`: `search_web`, `fetch_url`, `get_world_news`, `open_world_monitor`.
  - `system.py`: `get_current_time`, `get_system_info`.
  - Integrado a gerenciamento de tickets via Supabase.

### 2.3 Especificações Técnicas
- **Requisitos**: Python `>=3.11`, `uv` package manager.
- **Bibliotecas Chave**: `fastmcp`, `livekit-agents`, `httpx`, `pydantic`.

---

## 3. Jarvis Local Desktop (`jarvis-main`)

### 3.1 Visão Geral e Arquitetura
Uma assistente de voz desktop 100% privada, focada em interações contínuas e contextuais ("terceira pessoa na sala"). Ela escuta o ambiente e responde quando a palavra-chave ("Jarvis") é dita em qualquer parte da frase.

### 3.2 Funcionalidades Prontas e Validadas
- **Conversational & Contextual Awareness**: Mantém um buffer de contexto rolante da conversa do ambiente; quando ativada, entende a quem/o que se refere.
- **Dictation Mode (Substituto Offline do WisprFlow)**: Atalho global (ex: `Ctrl + Win`). Pressiona, fala e solta: o texto é transcrito offline via Whisper e colado automaticamente em qualquer app ativo (`Ctrl+V`). Inclui remoção de marcas de hesitação ("um", "uh") via LLM e dicionário customizado.
- **Filtro de Eco (Echo Detection & Hallucination Filter)**:
  - Ignora a própria fala da assistente quando emitida pelos alto-falantes.
  - Filtra transcrições falsas de silêncio do Whisper via `whisper_min_confidence` e `whisper_no_speech_threshold`.
- **Knowledge Graph Memory & Memory Viewer**: Memória duradoura auto-organizável em grafo que aprende preferências, histórico de refeições/saúde e diário. Inclui interface GUI para visualização e edição da memória.
- **Redação Automática de Dados Sensíveis**: Mascaramento automático de senhas, tokens e dados pessoais antes de salvar em disco.
- **Roteamento Inteligente de Ferramentas (Smart Tool Selection)**: Filtragem vetorial baseada em embeddings para carregar apenas as ferramentas necessárias por pergunta, permitindo conectar centenas de servidores MCP sem comprometer a performance do LLM.
- **Passes de Digest para LLMs Pequenos**: Para modelos de 2B a 7B (ex: `gemma4:e2b`), executa pré-processamentos rápidos que resumem retornos de memória e buscas web antes de enviar ao modelo principal.

### 3.3 Especificações Técnicas
- **Requisitos**: Python + PyInstaller (compilado para `.exe`, `.dmg`, `.tar.gz`).
- **Provedores de LLM Suportados**: Ollama (nativo), LM Studio, Jan, llama.cpp, LocalAI, vLLM, oMLX.
- **STT & TTS**: Faster-Whisper (com aceleração CUDA em Windows) + Piper TTS (voz Alan GB) ou Chatterbox (clonagem de voz com emoção).
- **Geolocalização Local**: GeoLite2 MMDB local + suporte a UPnP / OpenDNS para determinação de local/clima sem APIs de terceiros.

---

## 4. Leon 2.0 (`leon-develop`)

### 4.1 Visão Geral e Arquitetura
Leon é uma das plataformas de assistente pessoal open-source mais tradicionais, atualmente em sua versão 2.0 (Developer Preview). A nova versão transicionou de uma arquitetura baseada em intenções rígidas para uma arquitetura totalmente orientada a **Agentes, Ferramentas e Memória em Camadas**.

### 4.2 Funcionalidades Prontas e Validadas
- **Modos de Execução Flexíveis**:
  - `smart`: O sistema decide autonomamente entre fluxo determinístico ou planejamento de agente.
  - `controlled`: Executa de forma ultra-rápida e previsível através de skills nativas pré-definidas.
  - `agent`: Planejamento passo a passo com raciocínioReAct e ferramentas dinâmicas.
- **Arquitetura Modular em Camadas**:
  - `Skills -> Actions -> Tools -> Functions (-> Binaries)`.
  - Separação clara entre skills nativas (`skills/native/`) e skills baseadas em arquivo de especificação (`SKILL.md`).
- **Ponte Multi-linguagem (Bridges)**: Integração nativa de runtimes Node.js/TypeScript e Python através de pontes TCP e chamadas de processo.
- **Proactive Pulse System & Self-Model**: Sistema interno que mantém um modelo compacto da assistente e executa checagens proativas sem sobrecarregar a janela de contexto.
- **UI Web Completa (Aurora UI)**: Dashboard moderno e responsivo para monitoramento, chat e gerenciamento de tarefas.

### 4.3 Especificações Técnicas
- **Requisitos**: Node.js `>=24.0.0`, `pnpm`.
- **Estrutura de Pastas**: `server/`, `app/`, `aurora/`, `skills/`, `bridges/`, `tcp_server/`.

---

## 5. Ultron Orb UI (`ultron-by-sagar-builds-main`)

### 5.1 Visão Geral e Arquitetura
Uma interface gráfica futurista estilo holotable / orb 3D inspirada em Homem de Ferro / Ultron, desenvolvida para ser o "rosto" visual da assistente pessoal no navegador ou app Desktop.

### 5.2 Funcionalidades Prontas e Validadas
- **Renderização 3D de Alta Performance (Three.js)**:
  - Orbe holográfico multicamada: esferas wireframe rotativas, núcleo em espiral, código flutuante em sprites 3D, partículas de poeira e anéis de escaneamento.
  - Stack de pós-processamento: Bloom avançado (brilho neon) e aberração cromática.
- **Controle Gestual sem Toque via Webcam (MediaPipe HandLandmarker)**:
  - **Pinça Simples (1 Mão)**: Gira o orbe 3D no espaço seguindo o movimento dos dedos.
  - **Pinça Dupla (2 Mãos)**: Zoom in / Zoom out ao afastar ou aproximar as duas mãos.
  - Algoritmo com histerese para evitar artefatos de rastreamento de mão.
- **Controles Híbridos**: Mouse (drag/scroll), touch e atalhos de teclado (`G` para gestos, `R` para reset, `+`/`-` para zoom).

### 5.3 Especificações Técnicas
- **Stack**: Next.js (React), Three.js, `@mediapipe/tasks-vision`.

---

## Recomendação de Arquitetura para a "Luci Assistant"

Combinando os pontos fortes e validados de cada um dos 5 projetos, a arquitetura recomendada para a **Luci Assistant** deve ser:

```text
                                  ┌─────────────────────────────────────────┐
                                  │      UI / Interface de Interação        │
                                  │  - Ultron 3D Orb UI (Next.js/Three.js)  │
                                  │  - Tray Icon Desktop (Electron / PyQt)  │
                                  └────────────────────┬────────────────────┘
                                                       │ WebSockets / SSE
                                                       ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                            LUCI CORE ENGINE                                                │
│                                                                                                           │
│  ┌───────────────────────────────┐   ┌───────────────────────────────────┐   ┌─────────────────────────┐  │
│  │   Pipeline de Voz & Áudio     │   │     Orquestrador de Agentes       │   │   Memória & Contexto    │  │
│  │ - Faster-Whisper (CUDA)       │   │ - Modos: Smart/Controlled/Agent   │   │ - Graph Memory & Digest │  │
│  │ - Wake word "Luci" anywhere   │   │   (Inspirado no OpenJarvis/Leon)  │   │ - Redação sensível      │  │
│  │ - Echo Cancelling             │   │ - CodeAct & ReAct Loops           │   │ - Contexto do SO        │  │
│  │ - Mode Dictation (WisprFlow)  │   │ - DSPy/GEPA prompt optimizer      │   │ - GeoLite2 Local        │  │
│  └───────────────────────────────┘   └───────────────────────────────────┘   └─────────────────────────┘  │
│                                                       │                                                   │
│                                                       ▼                                                   │
│                                    ┌─────────────────────────────────────┐                                │
│                                    │        Camada de Integracao         │                                │
│                                    │  - FastMCP Servers (SSE/Stdio)       │                                │
│                                    │  - Standard agentskills.io (~13k)   │                                │
│                                    │  - Smart Tool Router (Embeddings)    │                                │
│                                    └──────────────────┬──────────────────┘                                │
└───────────────────────────────────────────────────────┼───────────────────────────────────────────────────┘
                                                        │
                                                        ▼
                                ┌───────────────────────────────────────────────┐
                                │            Automações & Execução              │
                                │  - Controle do SO (Mouse/Teclado/Apps)        │
                                │  - Home Assistant / Domótica                 │
                                │  - Telegram, WhatsApp, Discord Bridges        │
                                │  - Docker / Wasm Sandbox para código          │
                                └───────────────────────────────────────────────┘
```

### Principais Componentes a Copiar / Adaptar para a Luci:

1. **Do `Jarvis`**:
   - O algoritmo de detecção da wake-word em qualquer parte da frase (`Intent Judge` usando LLM pequeno).
   - O **Modo Ditado Global** (pressionar atalho, colar texto em qualquer app com limpeza de ruídos).
   - O sistema de **Filtro de Eco** e a gestão de **Memória em Grafo** com tela de edição GUI.
   - O **Smart Tool Selector** por embedding (essencial para escalar ferramentas sem quebrar o LLM).
2. **Do `OpenJarvis`**:
   - O padrão de **Skills `agentskills.io`** para importar diretamente milhares de rotinas prontas.
   - A sandbox em Docker/WASM para execução segura de código Python e comandos de terminal.
   - As integrações multi-canal (Telegram, Discord, WhatsApp).
3. **Do `Friday`**:
   - A arquitetura **FastMCP (SSE)** separando o backend de ferramentas do cliente de voz/UI.
   - A integração com **LiveKit Agents** se desejar uma voz ultra-fluida com streaming WebSocket de baixíssima latência.
4. **Do `Leon 2.0`**:
   - O conceito de modos de execução (`controlled` para coisas rápidas como "abrir app", `agent` para tarefas complexas como "pesquise X e monte um relatório").
5. **Do `Ultron UI`**:
   - A interface 3D em Three.js com controle por gestos de mão via webcam para dar um visual sci-fi impactante para o painel de controle da Luci.

---
*Relatório gerado em 09/08/2026 para fundamentar o início da implementação da Luci Assistant.*



# Plano de Arquitetura da Luci Assistant (Unificação: Jarvis + Leon 2.0 + Ultron Orb UI)

A **Luci Assistant** será uma assistente pessoal de próxima geração que combina:
1. **Inteligência Local, Voz & Memória em Grafo** do **Jarvis** (100% privado, detecção fluida de wake-word em qualquer parte da frase, modo ditado estilo WisprFlow, filtro de eco, Smart Tool Selection por embeddings e memória contextual).
2. **Modos de Execução & Arquitetura de Skills** do **Leon 2.0** (modos `Controlled` para tarefas imediatas/determinísticas, `Agent` para raciocínio em múltiplos passos e `Smart` para auto-decisão, além da estrutura modular `Skills -> Actions -> Tools`).
3. **Interface Visual 3D Holográfica com Controle Gestual** do **Ultron Orb UI** (Three.js futurista com efeito Bloom neon, interatividade por webcam via MediaPipe Hand Tracker e painel web responsivo Next.js/React).

---

## Estrutura da Arquitetura Unificada

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 LUCI FRONTEND & INTERFACE HUD                                    │
│                                                                                                  │
│   ┌──────────────────────────────────────────────────────────────────────────────────────────┐   │
│   │                         Ultron Holographic Orb (Three.js 3D)                             │   │
│   │  - Reação visual ao estado da voz (Listening, Thinking, Speaking, Idle)                  │   │
│   │  - Rastreamento de Mãos (MediaPipe): Gestos de Pinça para Rotacionar/Zoom                 │   │
│   │  - Dashboard de Estado da Assistente (Memória, Logs em tempo real, MCPs ativos)           │   │
│   └──────────────────────────────────────────┬───────────────────────────────────────────────┘   │
└──────────────────────────────────────────────┼───────────────────────────────────────────────────┘
                                               │ WebSockets (IPC / Eventos em Tempo Real)
                                               ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     LUCI CORE ENGINE (SERVER)                                    │
│                                                                                                  │
│   ┌─────────────────────────────┐   ┌────────────────────────────┐   ┌────────────────────────┐  │
│   │    Pipeline de Voz & Áudio  │   │  Engine de Modos (Leon 2.0)│   │ Sistema de Memória     │  │
│   │  - Faster-Whisper (CUDA)    │   │  - Controlled / Agent      │   │  - Grafo de Conhecimento│  │
│   │  - Wake-word "Luci"        │   │  - ReAct Multi-step        │   │  - Auto-Redação Dados   │  │
│   │  - Modo Ditado (WisprFlow)  │   │  - Smart Tool Router       │   │    Sensíveis           │  │
│   └─────────────────────────────┘   └────────────────────────────┘   └────────────────────────┘  │
│                                              │                                                   │
│                                              ▼                                                   │
│                               ┌──────────────────────────────┐                                   │
│                               │   Camada de Skills & Tools   │                                   │
│                               │ - Servidores MCP (FastMCP)   │                                   │
│                               │ - Automações de SO (Python)  │                                   │
│                               └──────────────────────────────┘                                   │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Proposta de Estrutura do Novo Repositório (Luci Assistant)

Recomendo criar o repositório em: `C:\Users\lucasv\.gemini\antigravity\scratch\luci-assistant`

```text
luci-assistant/
├── core/                        # Engine Principal (Python backend)
│   ├── audio/                   # Transcrição (Whisper), Wake-word, VAD e Síntese de Voz (TTS)
│   ├── memory/                  # Grafo de Conhecimento e Memória em Camadas
│   ├── execution/               # Modos de Execução (Controlled vs Agentic) inspirados no Leon
│   ├── mcp/                     # Gerenciador de Servidores MCP e Smart Tool Router
│   └── server.py                # Servidor API & WebSockets (FastAPI / Uvicorn)
├── ui/                          # Interface Futurista (Next.js + Three.js)
│   ├── components/              # Orb 3D, HUD, Visualizador de Memória e Logs
│   ├── lib/orbScene.ts          # Cena 3D Three.js do Orbe holográfico
│   ├── lib/handTracker.ts       # MediaPipe HandLandmarker (controle gestual)
│   └── package.json
└── skills/                      # Módulos de Automação e Ferramentas da Luci
```

---

## Plano de Fases para Desenvolvimento

1. **Fase 1: Configuração do Projeto Luci & Base da Interface 3D (Ultron)**
   - Inicializar o projeto `luci-assistant` na pasta `scratch`.
   - Montar a interface Next.js com o Orbe 3D Three.js e suporte ao controle por gestos via webcam (MediaPipe).
2. **Fase 2: Motor de Voz, Ditado e Wake-word (Jarvis)**
   - Integrar o motor de escuta contínua Faster-Whisper.
   - Implementar o filtro de wake-word ("Luci") e o modo ditado global.
   - Conectar os estados de áudio (Listening, Thinking, Speaking) aos efeitos visuais do Orbe 3D.
3. **Fase 3: Engine de Modos de Execução & Memória (Leon 2.0 + Jarvis)**
   - Implementar o sistema de execução em modos (`Controlled` para atalhos diretos e `Agent` para raciocínio complexo).
   - Integrar a memória em grafo com mascaramento de dados sensíveis e o Smart Tool Selector por embeddings.
4. **Fase 4: Automação & Extensibilidade MCP**
   - Conectar suporte a servidores MCP (Home Assistant, navegação Web, controle do sistema operacional, etc.).

---

## Confirmação

Você aprova essa abordagem de unificação desses 3 projetos para darmos início à criação do novo projeto `luci-assistant`?
