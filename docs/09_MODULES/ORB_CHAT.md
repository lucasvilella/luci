---
Title: Orb & Chat Module
Category: Modules
Status: Official
Version: 1.0
Owner: Lucas Vilella

Related Documents:
- CONVERSATION_ENGINE.md
- INTENT_ENGINE.md
- MODEL_ROUTER.md
- STATE_MACHINE.md
- VOICE.md
- MOBILE.md
- PERSONALITY_CORE.md
- IDENTITY_AND_WORKSPACES.md
Summary: O módulo Orb/Chat é a superfície conversacional universal da Luci — voz e texto — através da qual qualquer Capability de qualquer outro módulo pode ser acionada.
---

# ORB & CHAT MODULE

> *"Orb e Chat não são dois produtos. São duas portas para a mesma inteligência."*

---

# Objetivo

O módulo Orb/Chat é o ponto de entrada conversacional da Luci.

É onde acontece o bate-papo, a pesquisa, a geração de arquivos, a programação, e o acionamento por linguagem natural de qualquer Capability de qualquer outro módulo — Música, Filmes e Séries, Automação Residencial, ou futuros módulos.

Ele não é um módulo entre outros.

Ele é a interface universal de todos eles.

---

# Filosofia

Orb e Chat são duas apresentações do mesmo Conversation Engine.

Nunca dois cérebros.

Nunca duas memórias.

Nunca duas personalidades.

A diferença entre eles é apenas o canal — voz ou texto — nunca a inteligência por trás.

Trocar de um para o outro no meio de uma interação nunca perde contexto.

---

# Princípio Fundamental

```
Percepção (voz ou texto)

↓

Identity Resolution

↓

Intent Engine

↓

Model Router
  (heurística instantânea / modelo local / modelo em nuvem)

↓

Decision Engine
  (comando direto a outro módulo, ou raciocínio via Conversation Engine)

↓

Output
  (texto no Chat, voz no Orb, ou ambos)
```

Toda mensagem — dita ou digitada — percorre exatamente o mesmo caminho.

---

# Responsabilidades

O módulo Orb/Chat é responsável por:

- capturar entrada por voz ou texto;
- resolver identidade de quem está falando;
- classificar a intenção (comando direto vs. necessidade de raciocínio);
- rotear para o modelo/estratégia de inferência adequado;
- acionar Capabilities de outros módulos quando o pedido pertence a eles;
- manter uma única linha de histórico de conversa, independente do canal usado;
- expor os estados públicos definidos em `STATE_MACHINE.md` (idle, listening, processing, speaking);
- sintetizar e reproduzir voz de saída quando o canal for Orb.

---

# O que NÃO é responsabilidade

O módulo Orb/Chat nunca:

- decide recomendações de outros módulos (ex: nunca escolhe o que tocar — apenas aciona a Capability de Música, que decide);
- implementa lógica de automação residencial, streaming de mídia, ou qualquer outra inteligência de domínio;
- guarda estado de conversa que não esteja no Memory Core / Context Core;
- possui mais de uma instância de captação de voz ativa por dispositivo.

---

# Fluxo de Voz Contínua (Wake Word)

A captação de voz é um recurso único por dispositivo.

Apenas um componente escuta o microfone a qualquer momento — nunca uma instância por tela.

```
Microfone (recurso único)

↓

Wake Word local (sem envio de áudio à nuvem)

↓

Contexto ativo determina quem responde
  (Orb em primeiro plano, ou outro módulo com controle por voz, ex: Música)

↓

Captura de comando

↓

Intent Engine
```

Se o dispositivo estiver reproduzindo áudio de outro módulo (ex: Música) no momento da ativação, o volume é reduzido de forma suave — nunca pausado — durante a captura, e restaurado ao final.

---

# Fluxo de Texto

Idêntico ao fluxo de voz a partir do Intent Engine, sem as etapas de captação/síntese de áudio.

```
Texto digitado

↓

Identity Resolution (já conhecida pelo dispositivo/sessão)

↓

Intent Engine

↓

Model Router

↓

Output em texto
```

---

# Multimodalidade

O Orb/Chat aceita e produz mais do que texto e voz:

- upload de arquivos e imagens;
- geração de arquivos (documentos, planilhas, apresentações, código);
- execução de tarefas de programação.

Cada uma dessas capacidades é uma Capability exposta pelo Tool Engine, acionada pela conversa — nunca implementada dentro do módulo Orb/Chat em si.

---

# Relação com os Demais Módulos

Orb/Chat é a porta de entrada universal.

```
"Toca uma playlist calma"        → Capability do módulo Música
"O que tem passando na Netflix?" → Capability do módulo Filmes e Séries (biblioteca local/fontes plugadas)
"Apaga a luz da sala"            → Capability do módulo Automação Residencial
```

Cada módulo mantém sua própria tela dedicada para uso direto (ex: abrir a tela de Música e navegar visualmente), mas nenhuma Capability exposta por eles fica indisponível por voz/texto no Orb/Chat.

---

# Personalização por Identity e Workspace

A Personality Core da Luci é única — seu jeito de ser não muda entre pessoas.

O que se adapta é o **contexto carregado**:

- tom e nível de detalhe podem variar conforme o Personal Workspace ativo (ex: perfil infantil recebe respostas mais simples e sem determinados assuntos, conforme política definida em `PERMISSIONS.md`);
- histórico e memórias referenciadas são sempre as do Workspace correto — nunca vazam entre identidades;
- em dispositivos compartilhados (Tablet, Smart Display), o Orb/Chat entra em modo Guest até que uma identidade seja resolvida com confiança suficiente.

---

# Segurança

Comandos críticos disparados por conversa (ex: destravar uma porta, alterar uma configuração global, apagar memória) sempre exigem confirmação explícita — mesmo quando a identidade de quem fala já foi reconhecida com alta confiança.

Nenhuma ação irreversível é executada apenas por reconhecimento de voz.

---

# Observabilidade

Toda interação registra:

- canal utilizado (voz ou texto);
- Identity resolvida;
- Workspace ativo;
- classificação de intenção e latência;
- estratégia de modelo utilizada (heurística, local, nuvem);
- Capabilities acionadas em módulos externos.

---

# Evoluções Futuras

O módulo foi projetado para incorporar, sem alteração estrutural:

- reconhecimento de gestos como canal de entrada adicional, complementar à voz e ao texto;
- suporte a óculos inteligentes como uma interface Orb sem tela, priorizando voz e overlays visuais mínimos;
- reconhecimento de locutor (speaker recognition) integrado à captação contínua, permitindo identificar quem fala sem depender de login prévio no dispositivo.

---

# Princípios

O módulo Orb/Chat segue os princípios:

- um cérebro, múltiplos canais;
- a captação de voz é um recurso único, nunca duplicado;
- toda ação sensível exige confirmação, independente do canal;
- nenhuma inteligência de outro módulo é reimplementada aqui;
- continuidade de contexto entre voz e texto é obrigatória.

---

# Definição

O módulo Orb/Chat representa a superfície conversacional universal da Luci, unificando voz e texto sobre o mesmo Conversation Engine, e servindo como ponto de acionamento por linguagem natural de qualquer Capability exposta pelos demais módulos da plataforma.

---

> **"Você pode falar ou digitar. A Luci que responde é sempre a mesma."**

---

Fim do Documento.
