---
Title: Engine Scheduler
Category: Orchestration
Status: Official
Version: 1.0
Owner: Lucas Vilella

Related Documents:
- ORCHESTRATOR.md
- COGNITIVE_CYCLE.md
- WORKFLOW_MANAGER.md
- TASK_COORDINATOR.md
- FAILURE_RECOVERY.md
Summary: O Engine Scheduler é responsável por decidir quando e em qual ordem os Cognitive Cycles serão executados.
---

# ENGINE SCHEDULER

> *"Inteligência também depende de saber o que executar primeiro."*

---

# Objetivo

O Engine Scheduler é responsável por decidir quando e em qual ordem os Cognitive Cycles serão executados.

Ele distribui recursos computacionais entre múltiplos ciclos, respeitando prioridades, políticas de execução, dependências e disponibilidade da plataforma.

O Scheduler nunca executa um Engine.

Ele apenas organiza a execução.

---

# Filosofia

Nem toda tarefa possui a mesma importância.

Nem toda tarefa exige a mesma urgência.

O Scheduler existe para equilibrar desempenho, responsividade e utilização eficiente dos recursos.

---

# Responsabilidades

O Engine Scheduler é responsável por:

- ordenar Cycles;
- calcular prioridades;
- distribuir recursos;
- limitar concorrência;
- respeitar dependências;
- evitar starvation;
- aplicar políticas de execução;
- otimizar throughput.

---

# O que NÃO é responsabilidade

O Scheduler nunca:

- interpreta linguagem;
- toma decisões cognitivas;
- executa ferramentas;
- altera memória;
- conversa com usuários.

Ele apenas agenda execução.

---

# Pipeline

```
New Cycle

↓

Priority Evaluation

↓

Policy Evaluation

↓

Queue Selection

↓

Resource Allocation

↓

Dispatch

↓

Execution
```

---

# Priority Model

Cada Cycle recebe uma prioridade dinâmica.

A prioridade considera fatores como:

- urgência;
- impacto esperado;
- tipo do evento;
- canal de origem;
- prazo;
- dependências;
- modo operacional da plataforma;
- custo estimado.

A prioridade pode ser recalculada durante a execução.

---

# Execution Policies

Além da prioridade, cada Cycle recebe uma política de execução.

Políticas disponíveis:

- Critical
- Realtime
- Interactive
- Standard
- Background
- Batch
- Learning
- Maintenance

A política define como o Scheduler trata aquele Cycle.

---

# Queue Model

O Scheduler mantém filas independentes por política.

Exemplo.

```
Critical Queue

Realtime Queue

Interactive Queue

Standard Queue

Background Queue

Learning Queue
```

Isso evita que tarefas longas bloqueiem interações importantes.

---

# Concurrency Control

O número de Cycles simultâneos depende da capacidade disponível.

O Scheduler controla:

- número máximo de Cycles ativos;
- uso de CPU;
- uso de memória;
- uso de modelos;
- uso de ferramentas externas.

---

# Fairness

Nenhum Cycle pode esperar indefinidamente.

O Scheduler implementa mecanismos para evitar starvation.

Cycles antigos aumentam gradualmente sua prioridade efetiva.

---

# Dependencies

Um Cycle pode depender de outro.

Enquanto a dependência não for concluída, o Scheduler mantém o Cycle em espera.

---

# Preemption

Cycles de alta prioridade podem interromper temporariamente Cycles menos importantes.

Exemplo.

```
Background Learning

↓

Pausado

↓

Critical Voice Command

↓

Executado

↓

Background retomado
```

---

# Deadline Awareness

Quando um Cycle possui prazo conhecido, o Scheduler considera esse fator no cálculo da prioridade.

---

# Resource Awareness

O Scheduler considera recursos disponíveis antes de despachar um Cycle.

Exemplos.

- modelo ocupado;
- API indisponível;
- dispositivo offline;
- limite de tokens;
- custo permitido.

---

# Scheduler Modes

O comportamento do Scheduler pode mudar conforme o modo do sistema.

Exemplos.

- Interactive Mode;
- Background Mode;
- Critical Mode;
- Power Saving Mode;
- Distributed Mode.

Esses modos são definidos pelo Orchestrator.

---

# Relation with Orchestrator

O Orchestrator solicita agendamento.

O Scheduler decide quando despachar.

O Orchestrator continua responsável pelo ciclo de vida.

---

# Relation with Task Coordinator

Quando um Cycle possui múltiplas tarefas paralelas, o Scheduler trabalha em conjunto com o Task Coordinator para distribuir recursos.

---

# Observability

O Scheduler registra:

- tempo em fila;
- prioridade calculada;
- política aplicada;
- tempo de espera;
- recursos utilizados;
- mudanças de prioridade;
- preempções.

---

# Segurança

O Scheduler nunca altera permissões ou contexto.

Ele apenas agenda execuções previamente autorizadas.

---

# Evoluções Futuras

A arquitetura suporta:

- escalonamento distribuído;
- múltiplos nós de execução;
- balanceamento entre dispositivos;
- otimização por custo;
- otimização energética;
- previsão de carga baseada em IA.

---

# Princípios

O Engine Scheduler segue os princípios.

- prioridade dinâmica;
- políticas antes de filas;
- justiça entre execuções;
- uso eficiente de recursos;
- baixa latência para interações;
- escalabilidade horizontal.

---

# Definição

O Engine Scheduler representa o componente responsável por organizar a execução dos Cognitive Cycles da Luci, equilibrando prioridade, políticas, recursos e concorrência para garantir uma plataforma responsiva, eficiente e escalável em qualquer ambiente de execução.

---

> **"Toda inteligência precisa de tempo para pensar. O Scheduler decide quem pensa primeiro."**

---

Fim do Documento.