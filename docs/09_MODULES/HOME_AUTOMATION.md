---
Title: Home Automation Module
Category: Modules
Status: Official
Version: 1.0
Owner: Lucas Vilella

Related Documents:
- ZIGBEE.md
- MATTER.md
- MQTT.md
- HOME_ASSISTANT.md
- TOOL_ENGINE.md
- TOOL_REGISTRY.md
- IDENTITY_AND_WORKSPACES.md
- PERMISSIONS.md
- ORB_CHAT.md
Summary: O módulo Automação Residencial expõe sensores, atuadores e rotinas da casa como Capabilities, priorizando Zigbee como protocolo principal (independente de internet) e Matter/Wi-Fi como camada de interoperabilidade complementar.
---

# HOME AUTOMATION MODULE

> *"O protocolo conecta o dispositivo. A Luci entende o que ele significa para a casa."*

---

# Objetivo

O módulo Automação Residencial conecta a Luci ao ambiente físico da casa — iluminação, sensores, atuadores, climatização, segurança — expondo cada dispositivo como uma Capability semântica, independente do protocolo de comunicação por trás dele.

Zigbee é o protocolo principal, escolhido por não depender de conexão à internet para operar localmente. Matter e Wi-Fi complementam a cobertura para dispositivos que não suportam Zigbee.

---

# Filosofia

Um protocolo de automação conecta dispositivos.

A Luci conecta significados.

"Acender a luz da sala" nunca deveria depender, na cabeça de quem pede, de qual protocolo a lâmpada usa. Essa abstração já é o princípio adotado em `ZIGBEE.md` e `MATTER.md` — este documento define como isso vira uma experiência coerente de casa inteligente, não apenas uma integração técnica.

---

# Princípio Fundamental

```
Goal
  ("acender a luz da sala", "está muito quente aqui", rotina agendada, ou sensor)

↓

Home Automation Intelligence
  (parte do Decision Engine, lê o Home Workspace)

↓

Capability
  (ex: light.turn_on, climate.set_temperature, lock.unlock)

↓

Integration Layer
  (Zigbee primário; Matter/Wi-Fi complementar)

↓

Dispositivo físico
```

Nenhuma automação é executada sem passar pela validação de Permission Engine — especialmente dispositivos críticos (fechaduras, gás, portões).

---

# Responsabilidades

O módulo Automação Residencial é responsável por:

- expor sensores e atuadores como Capabilities semânticas, abstraindo Zigbee, Matter e Wi-Fi por trás de um contrato único;
- manter rotinas e automações no Home Workspace, compartilhadas por toda a residência;
- resolver presença física (quem está em qual ambiente) como parte do Context Core, para automações baseadas em presença;
- aplicar políticas de permissão diferenciadas por Identity e por dispositivo/ambiente (ver `PERMISSIONS.md`);
- registrar toda execução crítica para auditoria.

---

# O que NÃO é responsabilidade

O módulo Automação Residencial nunca:

- decide sozinho executar uma ação crítica sem confirmação, mesmo com identidade reconhecida;
- expõe dispositivos de um Workspace (ex: casa de praia) a Identities sem permissão explícita naquele Workspace;
- implementa lógica cognitiva própria — apenas traduz Goals em Capabilities e Capabilities em comandos de protocolo.

---

# Rotinas e Automações — Pertencem ao Home Workspace

```
"Modo Cinema"     → Home Workspace
"Bom dia"         → Home Workspace
"Saindo de casa"  → Home Workspace
```

Rotinas nunca pertencem a uma Identity individual — pertencem ao ambiente. Qualquer pessoa com permissão suficiente no Home Workspace pode acioná-las, editá-las é uma permissão mais restrita.

---

# Automação por Presença

A resolução de identidade (voz, dispositivo pessoal próximo, ou outra evidência) permite automações como:

```
Lucas entra na sala

↓

Identity Resolution: Lucas

↓

Cena preferida do Lucas aplicada (iluminação, temperatura)
```

Presença é apenas mais uma evidência de identidade, nunca uma autenticação definitiva — segue o mesmo princípio já definido em `IDENTITY_AND_WORKSPACES.md` para reconhecimento de voz.

---

# Permissões por Dispositivo e por Perfil

Nem todo dispositivo tem o mesmo nível de risco.

```
Luz do quarto        → baixo risco   → qualquer adulto da casa controla
Fechadura principal  → alto risco    → sempre exige confirmação, mesmo para o dono
Automação do quarto da criança → controlada por perfil adulto, nunca pelo perfil infantil
```

Identities com `profile_type: child` (ver `PERMISSIONS.md`) têm, por padrão:

- acesso apenas a dispositivos do próprio ambiente (ex: luz e som do próprio quarto);
- nenhum acesso a dispositivos de segurança (fechaduras, portões, alarmes);
- restrições de horário configuráveis por dispositivo (ex: luzes do quarto após determinado horário).

---

# Relação com o Módulo Música

Comandos de reprodução direcionados a um ambiente físico específico ("toca isso na sala") dependem deste módulo para rotear o áudio ao dispositivo de saída correto do ambiente.

---

# Relação com Orb/Chat

Toda automação acionável por voz ou texto passa pelo Intent Engine do módulo Orb/Chat, que despacha a Capability correspondente para este módulo. Sensores e eventos automáticos (ex: um sensor de presença) entram diretamente pelo Event Router, sem passar pela conversa.

---

# Segurança

- dispositivos críticos (fechaduras, gás, portões, câmeras) sempre exigem política `Confirm Before Execute`, independente do nível de confiança da identidade;
- nenhuma automação cruza Workspaces sem permissão explícita (ex: a casa de praia nunca é controlada a partir do Workspace Casa principal sem autorização);
- toda execução crítica gera registro de auditoria com Identity, Capability, dispositivo, decisão e horário.

---

# Observabilidade

Toda ação registra:

- Identity (ou "sensor"/"rotina agendada", quando não houver pessoa envolvida);
- Home Workspace de origem;
- Capability e dispositivo físico afetado;
- protocolo utilizado (Zigbee, Matter, Wi-Fi);
- resultado da execução.

---

# Evoluções Futuras

O módulo foi projetado para suportar, sem alteração estrutural:

- integração com câmeras e sensores de segurança como Capabilities adicionais;
- geofencing por dispositivo pessoal, complementando a presença física interna como evidência de identidade;
- automações preditivas baseadas em padrões aprendidos pelo Learning Engine (ex: antecipar uma rotina antes de ser pedida).

---

# Princípios

O módulo Automação Residencial segue os princípios:

- o protocolo nunca aparece na experiência — só a Capability;
- Zigbee como protocolo principal, independente de internet; Matter/Wi-Fi como complemento de cobertura;
- rotinas pertencem à casa, nunca a uma pessoa só;
- dispositivos críticos nunca executam sem confirmação;
- presença é evidência, nunca autenticação.

---

# Definição

O módulo Automação Residencial representa a camada física da Luci, traduzindo sensores, atuadores e rotinas domésticas em Capabilities semânticas, com permissões diferenciadas por Identity e por nível de risco do dispositivo, priorizando funcionamento local independente de conexão à internet.

---

> **"A internet pode cair. A luz da sala continua acendendo."**

---

Fim do Documento.
