---
Title: Naming Conventions
Category: Rules
Status: Official
Version: 1.0
Owner: Lucas Vilella

Related Documents:
- ARCHITECTURAL_PRINCIPLES.md
- API_CONTRACTS.md
- SYSTEM_ARCHITECTURE.md
- TOOL_REGISTRY.md
Summary: Este documento define as convenções oficiais de nomenclatura da Luci
---

# NAMING CONVENTIONS

> *"Nomes consistentes criam arquiteturas compreensíveis."*

---

# Objetivo

Este documento define as convenções oficiais de nomenclatura da Luci

Todos os componentes da plataforma devem seguir estes padrões para garantir consistência, clareza e previsibilidade.

---

# Filosofia

Os nomes devem representar responsabilidades.

Nunca tecnologias.

Nunca implementações específicas.

Sempre conceitos arquiteturais.

---

# Princípios Gerais

Todo nome deve ser:

- claro;
- descritivo;
- consistente;
- orientado ao domínio;
- independente da tecnologia.

---

# Linguagem Oficial

Toda arquitetura utiliza inglês.

Incluindo:

- código;
- APIs;
- documentação técnica;
- contratos;
- eventos;
- componentes.

Comentários internos podem utilizar português quando necessário.

---

# Componentes

## Engines

Sempre terminam com:

```
Engine
```

Exemplos:

```
PlanningEngine
MemoryEngine
LearningEngine
ConversationEngine
```

---

## Providers

Sempre terminam com:

```
Provider
```

Exemplos:

```
OpenAIProvider
LocalLLMProvider
WeatherProvider
CalendarProvider
```

---

## Managers

Sempre terminam com:

```
Manager
```

Exemplos:

```
PluginManager
PackageManager
ConfigurationManager
LicenseManager
```

---

## Registries

Sempre terminam com:

```
Registry
```

Exemplos:

```
ToolRegistry
ProviderRegistry
CapabilityRegistry
```

---

## Services

Utilizar apenas quando representar um serviço interno de domínio.

Evitar o uso indiscriminado do sufixo "Service".

---

## Interfaces

Sempre utilizar nomes descritivos.

Exemplo:

```
MemoryProvider
LanguageModelProvider
SpeechProvider
```

Evitar prefixos como:

```
IProvider
IEngine
```

---

# Eventos

Eventos representam fatos.

Sempre utilizar verbo no passado.

Exemplos:

```
GoalCreated
MessageReceived
MemoryStored
PluginInstalled
SessionClosed
```

Nunca:

```
CreateGoal
StoreMemory
InstallPlugin
```

---

# Capabilities

Sempre utilizar substantivos ou verbos no infinitivo que representem a capacidade oferecida.

Exemplos:

```
TextGeneration
ImageAnalysis
VoiceRecognition
SendMessage
SearchMemory
```

---

# Packages

Formato:

```
company.domain.package
```

Exemplos:

```
luci.home.automation
luci.business.crm
community.weather
```

---

# Plugins

Formato:

```
PluginNamePlugin
```

Exemplos:

```
HomeAssistantPlugin
TelegramPlugin
VisionPlugin
```

---

# Arquivos

Utilizar:

```
UPPER_SNAKE_CASE.md
```

Exemplos:

```
MEMORY_ENGINE.md
PLUGIN_SYSTEM.md
LICENSE_MANAGER.md
```

---

# Pastas

Utilizar:

```
UPPER_SNAKE_CASE
```

Estrutura oficial do repositório (fonte da verdade — prevalece sobre qualquer estrutura anterior mencionada em outros documentos):

```
00_CORE_FOUNDATION
01_ARCHITECTURE
02_CORES
03_COGNITIVE_ENGINES
04_ORCHESTRATION
05_INTELLIGENCE
06_INTERFACES
07_INTEGRATIONS
08_PLATFORM
90_FUTURE
99_RULES
```

---

# Nome Oficial da Plataforma

Sempre escrever:

```
Luci
```

Apenas em código, identificadores e nomes de arquivo utilizar:

```
LUCI
```

Nunca utilizar: Lucy, Luci AI, Luci Assistant, AI Lucy.

O núcleo cognitivo é referido oficialmente como **Mega Brain**. Nunca AI Core, Main AI, Master Brain ou Central Model.

---

# Categorias Estruturais de Alto Nível

Além das categorias de componente (Engine, Provider, Manager, Registry), a arquitetura reconhece quatro categorias estruturais mais amplas, usadas para organizar a documentação e o raciocínio arquitetural:

```
Brain       → inteligência global. Existe apenas um: o Mega Brain.
Core        → conhecimento ou estado permanente (ex.: IdentityCore, MemoryCore).
Layer       → agrupamento arquitetural (ex.: Intelligence Layer, Integration Layer). Nunca uma implementação.
Workspace   → contexto cognitivo executável carregado durante uma interação.
```

Essas categorias convivem com — e não substituem — Engine, Provider, Manager e Registry definidos acima.

---

# Classes

Utilizar:

```
PascalCase
```

---

# Métodos

Utilizar:

```
camelCase
```

---

# Constantes

Utilizar:

```
UPPER_SNAKE_CASE
```

---

# Variáveis

Utilizar:

```
camelCase
```

---

# Acrônimos

Utilizar apenas quando amplamente conhecidos.

Exemplos:

- API
- HTTP
- URL
- UUID
- JSON

Evitar criar novos acrônimos sem documentação.

---

# Vocabulário Oficial

Os seguintes termos fazem parte do vocabulário oficial da arquitetura:

- Capability
- Context
- Workspace
- Identity
- Session
- Memory
- Goal
- Provider
- Engine
- Plugin
- Package
- Event
- Registry
- Manager
- Contract

Evitar sinônimos para esses conceitos.

---

# O que Evitar

Não utilizar nomes baseados em:

- tecnologia;
- fornecedor;
- linguagem;
- implementação;
- detalhes internos.

Exemplo incorreto:

```
GPTConversationService
```

Exemplo correto:

```
ConversationEngine
```

---

# Evolução

Novos termos arquiteturais devem ser adicionados ao Vocabulário Oficial antes de serem utilizados no código ou na documentação.

---

# Princípios

As Naming Conventions seguem os princípios:

- clareza;
- consistência;
- independência tecnológica;
- previsibilidade;
- orientação ao domínio;
- reutilização do vocabulário oficial.

---

# Definição

As Naming Conventions estabelecem um vocabulário comum e regras de nomenclatura para toda a Luci Ao padronizar componentes, contratos e documentos, garantem que a arquitetura permaneça consistente, compreensível e sustentável ao longo de sua evolução.

---

> **"Quando todos usam o mesmo vocabulário, a arquitetura passa a falar uma única língua."**

---

Fim do Documento.