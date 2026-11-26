# Reactive Connection Monitor

Projeto desenvolvido para a disciplina **PARADIGMAS DE LINGUAGENS DE PROGRAMAÇÃO**, com o objetivo de investigar o impacto do uso de um **Harness para agentes de IA** no desenvolvimento de software orientado a eventos.

O repositório contém duas implementações independentes da mesma aplicação, compartilhando os mesmos requisitos funcionais e arquiteturais para permitir uma análise comparativa entre as abordagens:

- **Sem Harness (`no-harness/`):** desenvolvimento realizado por um agente de IA utilizando apenas os requisitos fornecidos diretamente no prompt, sem mecanismos persistentes de orientação ou validação arquitetural.
- **Com Harness (`harness/`):** desenvolvimento realizado por um agente de IA apoiado por artefatos persistentes no repositório, incluindo instruções, regras arquiteturais, testes e validações automatizadas.

LINK DO VÍDEO: https://youtu.be/bWd2igAvHt8
---

## Sumário

1. [Objetivo do projeto](#1-objetivo-do-projeto)
2. [Organização do repositório](#2-organização-do-repositório)
3. [Visão geral da aplicação](#3-visão-geral-da-aplicação)
4. [Requisitos funcionais](#4-requisitos-funcionais)
5. [Requisitos arquiteturais](#5-requisitos-arquiteturais)
6. [Testes](#6-testes)
7. [Requisitos de qualidade](#7-requisitos-de-qualidade)
8. [Implementação sem Harness](#8-implementação-sem-harness)
9. [Implementação com Harness](#9-implementação-com-harness)
10. [Comparação das abordagens](#10-comparação-das-abordagens)
11. [Critérios de avaliação](#11-critérios-de-avaliação)
12. [Metodologia do experimento](#12-metodologia-do-experimento)
13. [Resultados](#13-resultados)
14. [Conclusão](#14-conclusão)

---

## 1. Objetivo do projeto

Desenvolver uma aplicação capaz de monitorar o estado da conexão de internet do navegador e reagir às mudanças de conectividade, avaliando como um **Harness** auxilia um agente de IA durante o ciclo de desenvolvimento nos seguintes aspectos:

- Cumprimento de requisitos arquiteturais;
- Manutenção de uma arquitetura orientada a eventos;
- Criação e manutenção de testes automatizados;
- Identificação de problemas e validação automática da solução;
- Redução da necessidade de intervenções humanas.

> A comparação não parte da premissa de que uma implementação sem Harness será necessariamente incorreta, mas busca observar as diferenças práticas entre os processos e identificar os mecanismos adicionais proporcionados pelo Harness.

---

## 2. Organização do repositório

```text
Practical-Project-AB2-PLP/
├── README.md
├── harness/
│   └── ... # Implementação com Harness
└── no-harness/
    └── ... # Implementação sem Harness
```

- **`no-harness/`**: contém a implementação desenvolvida sem Harness. O agente recebeu os requisitos via prompt, sem regras arquiteturais persistentes, validadores específicos ou ciclo automatizado de feedback no repositório.
- **`harness/`**: contém a implementação desenvolvida com Harness. As regras e orientações são mantidas dentro do próprio repositório, acompanhadas de mecanismos automatizados para auxiliar na implementação e validação da arquitetura.

---

## 3. Visão geral da aplicação

O **Reactive Connection Monitor** monitora a conectividade do navegador em tempo real, atualiza o estado da aplicação, exibe notificações visuais e registra cada alteração no histórico.

```text
Eventos do navegador (online / offline)
                  │
                  ▼
       Camada de conectividade
                  │
                  ▼
         Estado da aplicação
                  │
                  ▼
          Componentes React
                  │
                  ▼
              Interface
```

---

## 4. Requisitos funcionais

Ambas as implementações devem atender aos seguintes requisitos funcionais:

| Código | Requisito | Descrição |
| :--- | :--- | :--- |
| **RF01** | Estado atual da conexão | Exibir claramente o estado atual da conexão (`ONLINE` ou `OFFLINE`). |
| **RF02** | Detecção de perda de conexão | Detectar quando o navegador perde a conexão. |
| **RF03** | Detecção de recuperação | Detectar quando o navegador recupera a conexão. |
| **RF04** | Notificação | Exibir uma notificação visual sempre que ocorrer uma mudança no estado da conexão. |
| **RF05** | Histórico | Registrar um histórico das mudanças de conectividade. |
| **RF06** | Informações do evento | Apresentar o estado da conexão e o horário de ocorrência para cada evento no histórico. |
| **RF07** | Persistência em execução | Manter o histórico disponível enquanto a aplicação estiver aberta. |
| **RF08** | Estado inicial | Iniciar a interface apresentando um estado coerente com a conectividade atual do navegador. |

---

## 5. Requisitos arquiteturais

O projeto segue uma abordagem **orientada a eventos**, mantendo a detecção dos eventos de conectividade desacoplada da camada de apresentação:

| Código | Princípio | Descrição |
| :--- | :--- | :--- |
| **RA01** | Arquitetura orientada a eventos | Utilizar os eventos `online` e `offline` do navegador como fonte para provocar mudanças de estado. |
| **RA02** | Separação de responsabilidades | Manter a lógica de observação de eventos separada dos componentes de apresentação. |
| **RA03** | Camada de conectividade | Isolar a detecção e transformação dos eventos do navegador em um estado consumível pela aplicação. |
| **RA04** | Componentes de apresentação | Consumir apenas o estado produzido pela camada de conectividade, sem implementar lógica de monitoramento na UI. |
| **RA05** | Fonte única de eventos | Manter uma única fonte observando `online` e `offline`, evitando múltiplos *listeners* independentes nos componentes. |
| **RA06** | Evitar duplicação | Centralizar a transformação dos eventos em estado em um único ponto de responsabilidade. |

---

## 6. Testes

As duas implementações devem conter testes automatizados cobrindo, no mínimo:

- Estado inicial da aplicação;
- Transição `ONLINE → OFFLINE`;
- Transição `OFFLINE → ONLINE`;
- Geração de notificações;
- Registro no histórico;
- Gerenciamento de *listeners* e ciclo de vida da camada de conectividade.

---

## 7. Requisitos de qualidade

- Utilizar **TypeScript** com tipagem adequada;
- Manter estrutura de diretórios organizada e solução simples;
- Evitar bibliotecas externas de gerenciamento de estado sem necessidade;
- Evitar funcionalidades fora do escopo especificado;
- Possuir suíte de testes automatizados funcional;
- Passar sem erros nas etapas de **lint**, **typecheck** e **build**.

---

## 8. Implementação sem Harness

Na versão `no-harness`, o agente recebeu todos os requisitos diretamente no prompt e estruturou a aplicação separando a camada de conectividade dos componentes React:

```text
src/
├── App.tsx
├── App.test.tsx
├── connectivity/
│   ├── ConnectionMonitor.ts
│   ├── ConnectionMonitor.test.ts
│   └── useConnectionMonitor.ts
└── test/
    └── setup.ts
```

A camada de conectividade abstrai a fonte de eventos do navegador e gerencia o estado da conexão, que é consumido pelo React por meio de `useSyncExternalStore`. Embora atenda aos requisitos principais, essa abordagem não dispõe de mecanismos no repositório para verificar automaticamente a conformidade arquitetural ao longo do desenvolvimento.

---

## 9. Implementação com Harness

Na versão `harness`, as regras do projeto são mantidas dentro do repositório de forma **persistente, explícita e verificável**, criando um ciclo automatizado de validação e feedback para o agente:

```text
Instruções do agente
         │
         ▼
Regras arquiteturais
         │
         ▼
Documentação do projeto
         │
         ▼
   Implementação
         │
         ▼
┌─────────────────────┐
│      Validação      │
├─────────────────────┤
│ • Testes            │
│ • Lint              │
│ • Typecheck         │
│ • Build             │
│ • Arquitetura       │
└──────────┬──────────┘
           │
           ▼
  Feedback / Correção
```

Entre os artefatos utilizados estão instruções para o agente, documentação e invariantes arquiteturais, testes automatizados e scripts de validação de qualidade e arquitetura.

---

## 10. Comparação das abordagens

| Aspecto | Sem Harness | Com Harness |
| :--- | :--- | :--- |
| **Requisitos funcionais** | Prompt | Prompt + documentação |
| **Regras arquiteturais** | Prompt | Regras persistentes no repositório |
| **Contexto do projeto** | Principalmente prompt | Repositório + instruções |
| **Testes, Lint, Typecheck e Build** | Sim | Sim |
| **Validação arquitetural automática** | Não | Sim |
| **Feedback automatizado** | Limitado | Presente |
| **Persistência das regras** | Baixa | Alta |
| **Intervenção humana** | Avaliada | Avaliada |

---

## 11. Critérios de avaliação

1. **Erros funcionais:** estado inicial incorreto, falhas na detecção de transições, notificações ausentes ou histórico não registrado.
2. **Violações arquiteturais:** componentes gerenciando diretamente os eventos do navegador, múltiplas fontes de *listeners*, duplicação de lógica ou acoplamento entre detecção e apresentação.
3. **Testes:** existência, cobertura dos fluxos principais, qualidade das asserções e capacidade de detectar regressões.
4. **Qualidade de código:** aprovação em lint, typecheck e build, organização, ausência de complexidade acidental e tipagem estrita em TypeScript.
5. **Intervenção humana:** quantidade e natureza das correções manuais necessárias durante o desenvolvimento.

---

## 12. Metodologia do experimento

Ambas as abordagens partem exatamente dos **mesmos requisitos funcionais e arquiteturais**, variando apenas os mecanismos de suporte disponíveis para o agente:

**Fluxo sem Harness:**

```text
Requisitos ──▶ Prompt ──▶ Agente de IA ──▶ Código ──▶ Avaliação humana
```

**Fluxo com Harness:**

```text
Requisitos ──▶ Prompt + Harness ──▶ Agente de IA ──▶ Código ──▶ Validações automáticas ──▶ Feedback ──▶ Correção
```

---

## 13. Resultados

Os registros detalhados de execução, intervenções realizadas, problemas identificados e resultados dos testes de cada abordagem estão documentados nos respectivos relatórios:

- **Sem Harness:** [no-harness/EXPERIMENT.md](./no-harness/EXPERIMENT.md)
- **Com Harness:** [harness/EXPERIMENT.md](./harness/EXPERIMENT.md)

---

## 14. Conclusão

O experimento demonstra que um agente de IA consegue produzir uma aplicação funcional e arquiteturalmente organizada mesmo sem um Harness, desde que receba requisitos bem definidos.

Contudo, o uso de um Harness transfere restrições que ficariam restritas ao contexto efêmero da conversa para dentro do ambiente de desenvolvimento, tornando-as documentadas, persistentes e verificáveis automaticamente. Assim, o Harness atua como um mecanismo de governança e feedback contínuo que reduz a dependência de revisões exclusivamente humanas.
