---
Title: Permissions
Category: Platform
Status: Official
Version: 1.1
Owner: Lucas Vilella

Related Documents:
- PLATFORM_ARCHITECTURE.md
- IDENTITY_AND_WORKSPACES.md
- CONTEXT_CORE.md
- TOOL_ENGINE.md
- INTEGRATION_MANAGER.md
- MUSIC.md
- MOVIES_SERIES.md
- HOME_AUTOMATION.md
Summary: O sistema de Permissions controla quais recursos, capacidades e informações podem ser acessados por cada Identity dentro da plataforma, incluindo a granularidade de perfis (adulto, criança, convidado) e a política de divulgação de dados entre Identities.
---

# PERMISSIONS

> *"Permissões definem os limites da ação. A inteligência sempre respeita esses limites."*

---

# Objetivo

O sistema de Permissions controla quais recursos, capacidades e informações podem ser acessados por cada Identity dentro da plataforma.

As permissões garantem segurança, privacidade e isolamento entre usuários, Workspaces e integrações.

---

# Filosofia

A inteligência nunca ignora permissões.

Toda decisão da Luci é limitada pelas regras definidas neste sistema.

Nenhum Engine pode contornar uma permissão.

---

# Princípio Fundamental

```
Identity

↓

Workspace

↓

Permission Engine

↓

Capability

↓

Resource
```

Toda operação é validada antes de ser executada.

---

# Responsabilidades

O sistema de Permissions é responsável por:

- validar acessos;
- controlar execução de Capabilities;
- restringir recursos;
- proteger informações sensíveis;
- registrar auditoria;
- aplicar políticas de segurança;
- aplicar políticas de conteúdo e divulgação de dados por perfil de Identity.

---

# O que NÃO é responsabilidade

O sistema nunca:

- interpreta intenções;
- toma decisões cognitivas;
- executa Goals;
- aprende preferências.

Seu papel é exclusivamente autorizar ou negar operações.

---

# Níveis de Permissão

As permissões podem ser definidas em diferentes níveis.

## Identity

Exemplo:

- administrador;
- usuário;
- convidado.

---

## Workspace

Exemplo:

Lucas possui acesso total ao Workspace Casa.

Apenas leitura no Workspace Empresa.

---

## Capability

Exemplo:

Pode:

- consultar agenda;
- controlar iluminação;
- enviar mensagens.

Não pode:

- apagar memória;
- alterar configurações globais;
- instalar Plugins.

---

## Resource

Exemplo:

Pode controlar:

- luzes da sala.

Não pode controlar:

- fechadura principal.

---

# Profile Types

Toda Identity do tipo Pessoa possui um `profile_type`, que carrega um conjunto de políticas padrão aplicadas antes de qualquer outra permissão específica.

## Adult

Perfil padrão. Acesso completo às Capabilities autorizadas para o seu nível dentro de cada Workspace, sem filtro de conteúdo aplicado por padrão.

## Child

Perfil com políticas de proteção ativas por padrão em todos os módulos:

- **Música / Filmes e Séries**: filtro de conteúdo explícito e classificação indicativa máxima configurável (ver `MUSIC.md` e `MOVIES_SERIES.md`);
- **Automação Residencial**: acesso restrito a dispositivos do próprio ambiente; nenhum acesso a dispositivos de segurança (ver `HOME_AUTOMATION.md`);
- **Orb/Chat**: tom e conteúdo de resposta adaptados; determinados assuntos exigem redirecionamento a um adulto responsável;
- **Tempo de uso**: limite de horário configurável por módulo, aplicado antes da execução de qualquer Capability daquele módulo.

Essas políticas são configuráveis por um adulto responsável pelo Home Workspace, nunca pela própria Identity com `profile_type: child`.

## Guest

Identidade sem persistência garantida. Contexto mínimo, sem memória permanente por padrão, sem acesso a informações privadas de nenhum outro Workspace.

---

# Data Disclosure Policy (Política de Divulgação de Dados)

Toda categoria de dado pessoal (agenda, localização, gosto musical, histórico de consumo de mídia, mensagens, documentos, dados financeiros) possui uma política de divulgação, definida pelo dono do dado, que determina quem mais pode acessá-la.

## Owner Only

Visível apenas para a própria Identity dona do dado.

Exemplo padrão: conversas, documentos pessoais, objetivos individuais.

## Household

Visível para qualquer Identity do mesmo Home Workspace.

Exemplo padrão: lista de compras, calendário familiar, automações da casa.

## Shareable With Consent

Visível apenas mediante autorização explícita, concedida item a item ou por categoria, pelo dono do dado.

Exemplo: Ana pode marcar itens específicos da própria agenda como visíveis para o Lucas, mantendo o restante privado.

```
Lucas pergunta: "o que a Ana tem marcado pra hoje?"

↓

Permission Engine consulta a Data Disclosure Policy da agenda da Ana

↓

Retorna apenas os itens marcados como Shareable With Consent para o Lucas
```

## Public in Context

O dado bruto permanece privado, mas pode influenciar um resultado sem ser exposto diretamente.

Exemplo: o gosto musical pessoal de alguém pode influenciar a playlist tocada num ambiente compartilhado (ex: festa na sala) sem que o histórico de escuta em si seja exibido para os demais presentes.

---

# Matriz de Avaliação

Toda solicitação de dado ou execução de Capability é avaliada nos três eixos simultaneamente:

```
Quem pergunta       (Identity solicitante)

×

Sobre o quê          (categoria de dado ou Capability)

×

De quem é o dado      (Identity ou Workspace dono do recurso)

↓

Data Disclosure Policy aplicável

↓

Allow / Deny / Confirm Before Execute / Partial (apenas itens autorizados)
```

---

# Dynamic Permissions

Permissões podem depender do contexto.

Exemplos:

- localização;
- horário;
- dispositivo utilizado;
- autenticação recente;
- presença física;
- nível de risco.

O Context Core pode fornecer informações para avaliação dessas políticas.

---

# Políticas

A plataforma suporta políticas como:

- Allow;
- Deny;
- Read Only;
- Confirm Before Execute;
- Temporary Access.

---

# Auditoria

Toda validação gera registros contendo:

- Identity;
- Workspace;
- Capability;
- Resource;
- decisão;
- motivo;
- timestamp.

---

# Segurança

O sistema suporta:

- autenticação multifator;
- autorização baseada em papéis;
- políticas contextuais;
- isolamento entre Workspaces;
- criptografia.

Dispositivos e Capabilities classificados como críticos (ex: fechaduras, dados financeiros, exclusão de memória) sempre aplicam a política `Confirm Before Execute`, independentemente do `profile_type` ou do nível de confiança da identidade resolvida.

---

# Observabilidade

São registrados:

- acessos autorizados;
- acessos negados;
- alterações de permissões;
- elevação de privilégios;
- tentativas suspeitas.

---

# Escalabilidade

A arquitetura suporta:

- milhares de Identities;
- múltiplos Workspaces;
- políticas personalizadas;
- organizações independentes;
- ambientes distribuídos;
- novos `profile_type` além de Adult, Child e Guest, sem alteração estrutural.

---

# Evoluções Futuras

O sistema foi projetado para suportar:

- políticas baseadas em IA;
- avaliação contínua de risco;
- permissões temporárias automáticas;
- delegação entre usuários;
- aprovação em múltiplos níveis.

Qualquer proposta de mudança de política originada por um futuro Self Evaluation Engine (ver `ARCHITECTURE_EVOLUTION.md`, item 26) é registrada como proposta em `DECISIONS_LOG.md` para aprovação humana — nunca aplicada automaticamente, em conformidade com o Non-Negotiable 13 (Plugins expandem, nunca modificam o núcleo).

---

# Princípios

Permissions seguem os princípios:

- segurança por padrão;
- menor privilégio possível;
- contexto influencia autorização;
- auditoria obrigatória;
- desacoplamento da lógica cognitiva;
- transparência;
- o dono do dado define sua política de divulgação — a plataforma nunca presume compartilhamento.

---

# Definição

O sistema de Permissions controla o acesso a capacidades, recursos e informações da Luci, garantindo que toda operação respeite as políticas de segurança, o perfil da Identity solicitante e a política de divulgação de dados definida pelo dono do recurso. Ele atua como uma camada obrigatória de autorização entre a intenção da inteligência e a execução das ações.

---

> **"A inteligência pode decidir o que fazer. As permissões determinam se ela está autorizada a fazer."**

---

Fim do Documento.