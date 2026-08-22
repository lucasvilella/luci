---
Title: Coding Standards
Category: Rules
Status: Official
Version: 1.0
Owner: Lucas Vilella

Related Documents:
- ARCHITECTURAL_PRINCIPLES.md
- NAMING_CONVENTIONS.md
- DESIGN_RULES.md
- API_CONTRACTS.md
- DOCUMENTATION_RULES.md
Summary: Este documento define os princípios de desenvolvimento de software da L.U.C.I.
---

# CODING STANDARDS

> *"Código é um meio de expressar arquitetura. Clareza sempre tem prioridade sobre complexidade."*

---

# Objetivo

Este documento define os princípios de desenvolvimento de software da L.U.C.I.

Seu propósito é garantir que todo código produzido permaneça consistente, compreensível, desacoplado e alinhado com a arquitetura da plataforma.

As regras aqui descritas são independentes de linguagem de programação.

---

# Filosofia

O código deve refletir a arquitetura.

Implementações passam.

A arquitetura permanece.

---

# Princípios Gerais

Todo código deve ser:

- simples;
- legível;
- modular;
- previsível;
- observável;
- testável.

Sempre priorizar clareza em vez de soluções excessivamente sofisticadas.

---

# Responsabilidade Única

Cada componente deve possuir apenas uma responsabilidade claramente definida.

Se um componente possui múltiplas razões para mudar, ele provavelmente deve ser dividido.

---

# Dependências

Dependências devem ocorrer através de contratos públicos.

Nunca através de implementações concretas.

Sempre que possível utilizar inversão de dependência.

---

# Acoplamento

Evitar qualquer forma de acoplamento desnecessário.

Componentes não devem conhecer detalhes internos de outros componentes.

A comunicação deve ocorrer através de interfaces, contratos ou eventos.

---

# Complexidade

Sempre escolher a solução mais simples que resolva corretamente o problema.

Evitar:

- abstrações prematuras;
- otimizações antecipadas;
- hierarquias desnecessárias;
- lógica duplicada.

---

# Legibilidade

O código deve responder claramente:

- O que faz?
- Por que existe?
- Qual responsabilidade possui?
- Quais contratos implementa?

A leitura deve ser mais importante que a escrita.

---

# Métodos

Métodos devem:

- executar uma única tarefa;
- possuir nomes descritivos;
- minimizar efeitos colaterais;
- evitar profundidade excessiva.

Sempre que possível, favorecer pequenas funções compostas.

---

# Estado

Evitar estado compartilhado.

Quando necessário:

- definir claramente o proprietário;
- controlar mutações;
- documentar o ciclo de vida.

---

# Erros

Erros devem ser tratados explicitamente.

Evitar:

- capturas silenciosas;
- retornos ambíguos;
- falhas ocultas.

Toda falha relevante deve ser observável.

---

# Observabilidade

Componentes relevantes devem produzir:

- logs;
- métricas;
- eventos;
- informações de diagnóstico.

A ausência de observabilidade é considerada um defeito arquitetural.

---

# Comentários

Comentários devem explicar:

- decisões;
- restrições;
- contexto;
- motivos.

Nunca comentar algo que já esteja evidente no código.

---

# Reutilização

Antes de criar um novo componente, verificar se uma Capability ou módulo existente já atende ao mesmo propósito.

Duplicação deve ser evitada.

---

# Testabilidade

Todo componente deve ser projetado para facilitar testes automatizados.

Dependências externas devem ser desacopladas da lógica principal.

---

# Performance

Otimizações devem ser baseadas em medições reais.

Nunca sacrificar clareza por ganhos hipotéticos.

---

# Evolução

Novas implementações devem preservar:

- contratos públicos;
- compatibilidade;
- comportamento esperado.

Mudanças incompatíveis exigem processo formal de migração.

---

# Revisão de Código

Toda revisão deve responder:

1. O código respeita os princípios arquiteturais?
2. A responsabilidade está bem definida?
3. Existe acoplamento desnecessário?
4. Há duplicação evitável?
5. O componente é observável?
6. Está suficientemente documentado?
7. Pode ser facilmente testado?
8. O código será compreendido por outro desenvolvedor daqui a um ano?

---

# O que Evitar

Evitar:

- lógica duplicada;
- dependências circulares;
- classes ou módulos "Deus";
- código morto;
- comentários desatualizados;
- otimizações sem evidências;
- dependências ocultas;
- efeitos colaterais inesperados.

---

# Princípios

Os Coding Standards seguem os princípios:

- simplicidade;
- responsabilidade única;
- desacoplamento;
- previsibilidade;
- observabilidade;
- manutenção facilitada.

---

# Definição

Os Coding Standards estabelecem os princípios de desenvolvimento da L.U.C.I., orientando a implementação de componentes de forma consistente com a arquitetura da plataforma. Seu objetivo é garantir que o código permaneça claro, modular, sustentável e preparado para evoluir ao longo do tempo.

---

> **"Arquiteturas sólidas nascem de decisões simples repetidas de forma consistente."**

---

Fim do Documento.