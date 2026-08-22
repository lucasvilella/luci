---
name: Provider Generator
description: >
  Projeta e gera a arquitetura de novos Providers para a L.U.C.I.,
  garantindo integração segura, desacoplada e consistente com a arquitetura oficial da plataforma.

version: 1.0
owner: Lucas
project: L.U.C.I.
architecture: Cognitive Operating System

requires:
  - Architecture Guardian
  - Capability Designer

triggers:
  - criar provider
  - novo provider
  - integração
  - integrar api
  - integrar serviço
  - integrar sistema
  - provider
  - external provider
---

# Provider Generator

## Objetivo

Projetar novos Providers respeitando integralmente a arquitetura da L.U.C.I.

Providers conectam a plataforma a sistemas externos.

Eles nunca implementam regras cognitivas.

---

# Consulte sempre

Antes de responder, considere obrigatoriamente:

- docs/07_PROVIDERS/
- docs/99_RULES/ARCHITECTURAL_PRINCIPLES.md
- docs/99_RULES/DESIGN_RULES.md
- docs/99_RULES/NON_NEGOTIABLES.md
- docs/99_RULES/SECURITY_RULES.md
- docs/99_RULES/NAMING_CONVENTIONS.md

---

# Processo

## 1. Identifique o sistema externo

Determine:

- API
- Banco de Dados
- Serviço
- IA
- Mensageria
- Hardware
- Cloud
- Sistema Operacional

Descreva claramente o papel do Provider.

---

## 2. Defina a responsabilidade

Explique:

- O que o Provider faz.
- O que ele NÃO faz.

Providers existem apenas para integração.

Nunca implementam lógica de negócio.

Nunca implementam inteligência.

---

## 3. Defina contratos

Especifique:

### Entradas

### Saídas

### Eventos publicados

### Eventos consumidos

Toda comunicação deve ocorrer através de contratos públicos.

---

## 4. Capabilities

Liste quais Capabilities utilizarão este Provider.

Nunca permita que Interfaces ou Engines dependam diretamente dele.

---

## 5. Configuração

Especifique:

- credenciais
- endpoints
- timeout
- retry
- circuit breaker
- cache
- rate limit

Toda configuração deve ser externa.

Nunca utilizar valores fixos.

---

## 6. Segurança

Verifique:

- autenticação
- autorização
- armazenamento seguro de segredos
- criptografia
- isolamento

Nenhum segredo deve existir no código.

---

## 7. Resiliência

Sempre definir:

- retry policy
- timeout
- fallback
- circuit breaker
- tratamento de erros

O Provider nunca deve comprometer a estabilidade da plataforma.

---

## 8. Observabilidade

Defina obrigatoriamente:

- logs
- métricas
- tracing
- health check
- auditoria

Todo Provider deve ser monitorável.

---

## 9. Estrutura recomendada

Sempre apresentar:

### Nome do Provider

### Objetivo

### Responsabilidade

### Não Responsabilidades

### Sistema Integrado

### Contratos

### Capabilities

### Configuração

### Segurança

### Resiliência

### Observabilidade

### Componentes Relacionados

### Recomendações de Implementação

---

# Nunca faça

- implementar lógica cognitiva;
- implementar regras de negócio;
- acessar Memory diretamente;
- acessar Interfaces;
- criar dependências circulares;
- armazenar credenciais no código;
- retornar estruturas específicas da API externa para o Core.

Sempre adapte a integração para os contratos internos da L.U.C.I.

---

# Resultado esperado

Todo Provider gerado deve:

- possuir uma única responsabilidade;
- ser desacoplado da implementação externa;
- utilizar contratos públicos;
- respeitar os princípios de segurança;
- possuir configuração externa;
- ser resiliente;
- ser completamente observável;
- integrar-se naturalmente à arquitetura da L.U.C.I.