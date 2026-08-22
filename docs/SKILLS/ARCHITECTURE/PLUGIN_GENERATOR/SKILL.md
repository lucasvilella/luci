---
name: Plugin Generator
description: >
  Projeta novos Plugins para a L.U.C.I., garantindo que toda extensão da
  plataforma seja modular, desacoplada e compatível com a arquitetura oficial.

version: 1.0
owner: Lucas
project: L.U.C.I.
architecture: Cognitive Operating System

requires:
  - Architecture Guardian
  - Capability Designer

triggers:
  - criar plugin
  - novo plugin
  - extensão
  - plugin
  - adicionar plugin
  - instalar plugin
  - expandir plataforma
---

# Plugin Generator

## Objetivo

Projetar Plugins que expandam a L.U.C.I. sem modificar o Core da plataforma.

Plugins adicionam capacidades.

Nunca alteram a arquitetura central.

---

# Consulte sempre

Antes de responder, considere obrigatoriamente:

- docs/08_PLATFORM/PLUGIN_MANAGER.md
- docs/08_PLATFORM/PACKAGE_MANAGER.md
- docs/99_RULES/ARCHITECTURAL_PRINCIPLES.md
- docs/99_RULES/NON_NEGOTIABLES.md
- docs/99_RULES/SECURITY_RULES.md
- docs/99_RULES/DESIGN_RULES.md

---

# Processo

## 1. Identifique o objetivo

Determine claramente:

- Qual funcionalidade será adicionada?
- Esta funcionalidade pertence ao Core?
- Ela pode ser implementada como Plugin?

Sempre prefira Plugins para funcionalidades opcionais.

---

## 2. Defina a responsabilidade

Explique:

- O que o Plugin adiciona.
- O que ele NÃO deve fazer.

Plugins nunca substituem componentes do Core.

---

## 3. Identifique dependências

Liste:

- Capabilities utilizadas
- Providers necessários
- Engines envolvidos
- Packages opcionais

Nunca criar dependências obrigatórias do Core para o Plugin.

---

## 4. Defina contratos

Especifique:

### Eventos publicados

### Eventos consumidos

### Capabilities registradas

### Configurações

Toda integração deve ocorrer através de contratos públicos.

---

## 5. Ciclo de vida

Defina:

- instalação
- inicialização
- atualização
- desativação
- remoção

O Plugin deve ser totalmente independente.

---

## 6. Configuração

Defina:

- parâmetros
- permissões
- dependências
- recursos opcionais

Toda configuração deve ser externa.

---

## 7. Segurança

Verifique:

- permissões necessárias;
- isolamento;
- acesso ao Context;
- acesso à Memory;
- acesso a Providers.

Plugins nunca podem contornar políticas de segurança.

---

## 8. Observabilidade

Defina:

- logs
- métricas
- eventos
- health check
- auditoria

Todo Plugin deve ser monitorável.

---

## 9. Estrutura recomendada

Sempre apresentar:

### Nome

### Objetivo

### Responsabilidade

### Não Responsabilidades

### Capabilities

### Eventos

### Dependências

### Configuração

### Segurança

### Observabilidade

### Ciclo de Vida

### Recomendações de implementação

---

# Nunca faça

- modificar componentes do Core;
- substituir Engines existentes;
- acessar Memory diretamente;
- criar dependências circulares;
- armazenar estado crítico internamente;
- implementar lógica cognitiva fora dos Engines.

Plugins expandem.

Nunca modificam.

---

# Resultado esperado

Todo Plugin gerado deve:

- ser modular;
- ser desacoplado;
- possuir responsabilidade única;
- integrar-se por contratos públicos;
- respeitar os Non-Negotiables;
- poder ser instalado ou removido sem impactos na arquitetura;
- estar pronto para implementação dentro da plataforma L.U.C.I.