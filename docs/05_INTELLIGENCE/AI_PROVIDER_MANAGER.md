---
Title: AI Provider Manager
Category: Intelligence
Status: Official
Version: 1.0
Owner: Lucas Vilella

Related Documents:
- MODEL_ROUTER.md
- MODEL_CAPABILITIES.md
- CONTEXT_BUILDER.md
- TOKEN_MANAGER.md
- TOOL_ENGINE.md
- SECURITY_RULES.md
Summary: O AI Provider Manager é responsável por gerenciar todos os provedores de Inteligência Artificial utilizados pela plataforma.
---

# AI PROVIDER MANAGER

> *"Modelos mudam. Capacidades permanecem."*

---

# Objetivo

O AI Provider Manager é responsável por gerenciar todos os provedores de Inteligência Artificial utilizados pela plataforma.

Ele abstrai completamente as diferenças entre APIs, modelos, autenticação, limites, custos e formatos de resposta, oferecendo uma interface única para o restante da arquitetura.

Nenhum componente da Luci conhece diretamente OpenAI, Anthropic, Google, Ollama ou qualquer outro fornecedor.

---

# Filosofia

A inteligência da Luci não pertence a um modelo.

Os modelos são apenas mecanismos capazes de fornecer determinadas capacidades cognitivas.

A plataforma deve permanecer independente de qualquer fornecedor.

Trocar um provedor nunca deve exigir alterações na arquitetura.

---

# Princípio Fundamental

Toda comunicação com modelos acontece através do AI Provider Manager.

```
Cognitive Engine

↓

Model Router

↓

AI Provider Manager

↓

Provider Adapter

↓

LLM
```

---

# Responsabilidades

O AI Provider Manager é responsável por:

- registrar provedores;
- gerenciar autenticação;
- padronizar chamadas;
- controlar versões;
- monitorar disponibilidade;
- aplicar políticas de uso;
- abstrair diferenças entre APIs;
- fornecer métricas operacionais.

---

# O que NÃO é responsabilidade

O AI Provider Manager nunca:

- escolhe qual modelo utilizar;
- monta contexto;
- cria prompts;
- interpreta respostas;
- toma decisões cognitivas.

Essas responsabilidades pertencem a outros componentes.

---

# Conceitos

## Provider

Representa uma plataforma de IA.

Exemplos.

- OpenAI
- Anthropic
- Google
- OpenRouter
- Ollama
- LM Studio
- Azure OpenAI
- AWS Bedrock
- Provedores futuros

---

## Adapter

Cada Provider possui um Adapter responsável por traduzir a interface padrão da Luci para a API específica do fornecedor.

```
Provider Adapter

↓

Provider API
```

Isso elimina dependências diretas.

---

## Provider Registry

Todos os provedores disponíveis são registrados.

Cada registro contém:

- Provider ID;
- Nome;
- Tipo;
- Endpoint;
- Capacidades;
- Modelos disponíveis;
- Status;
- Políticas;
- Credenciais;
- Configurações.

---

# Tipos de Provider

A arquitetura suporta:

## Cloud Providers

Modelos hospedados externamente.

Exemplos.

- OpenAI
- Anthropic
- Google

---

## Local Providers

Modelos executados localmente.

Exemplos.

- Ollama
- LM Studio
- vLLM
- LocalAI

---

## Hybrid Providers

Parte local.

Parte em nuvem.

---

# Provider Status

Cada Provider possui estado.

```
Available

Busy

Limited

Offline

Maintenance
```

O Model Router utiliza essas informações.

---

# Health Monitoring

O AI Provider Manager monitora continuamente:

- disponibilidade;
- latência;
- taxa de erro;
- limites de uso;
- consumo de recursos;
- custo médio.

---

# Failover

Caso um Provider fique indisponível.

O AI Provider Manager informa o Model Router.

O Model Router poderá selecionar outro Provider compatível.

O failover nunca acontece automaticamente dentro deste componente.

---

# Versionamento

Cada Provider pode possuir:

- múltiplas APIs;
- múltiplos modelos;
- múltiplas versões.

Todas coexistem através do mesmo Adapter.

---

# Configuração

Cada Provider pode definir:

- timeout;
- limite de requisições;
- políticas de retry;
- custo máximo;
- regiões;
- autenticação;
- headers personalizados.

---

# Segurança

Credenciais nunca ficam expostas aos Engines.

O AI Provider Manager é o único componente autorizado a armazenar:

- API Keys;
- Tokens;
- Certificados;
- Secrets.

Toda comunicação deve utilizar conexões seguras.

---

# Observabilidade

O componente registra:

- número de chamadas;
- tempo médio;
- custo estimado;
- erros;
- retries;
- disponibilidade;
- throughput;
- consumo por Workspace;
- consumo por Identity.

---

# Relação com o Model Router

O Model Router escolhe o modelo.

O AI Provider Manager executa a comunicação.

Essa separação mantém responsabilidades bem definidas.

---

# Relação com o Token Manager

Antes da execução.

O Token Manager valida limites.

Após a execução.

O AI Provider Manager informa consumo real.

---

# Relação com o Context Builder

O Context Builder prepara a entrada.

O AI Provider Manager apenas a transmite.

---

# Escalabilidade

A arquitetura suporta:

- múltiplos provedores simultâneos;
- múltiplas regiões;
- balanceamento entre Providers;
- execução híbrida Local + Cloud;
- novos fornecedores sem alterações na arquitetura.

---

# Evoluções Futuras

O componente foi projetado para suportar:

- descoberta automática de Providers;
- marketplace de conectores;
- seleção baseada em custo;
- seleção baseada em desempenho;
- execução distribuída;
- cache inteligente de respostas.

---

# Princípios

O AI Provider Manager segue os princípios:

- independência de fornecedor;
- interface única;
- segurança centralizada;
- observabilidade completa;
- adaptadores desacoplados;
- extensibilidade permanente.

---

# Definição

O AI Provider Manager representa a camada de abstração entre a Luci e qualquer fornecedor de Inteligência Artificial. Ele padroniza a comunicação, protege a arquitetura contra mudanças externas e garante que a plataforma permaneça independente de tecnologias específicas, permitindo a integração transparente de modelos locais, em nuvem ou híbridos.

---

> **"Os modelos são intercambiáveis. A inteligência da Luci não é."**

---

Fim do Documento.