# Reactive Connection Monitor

## Visão Geral e Objetivo

Este repositório realiza um estudo comparativo de geração de código em React com e sem um **Agent Harness**. Os dois ambientes representam abordagens diferentes para a construção da mesma aplicação: o **Reactive Connection Monitor**, um monitor reativo e orientado a eventos de conectividade implementado com **React 19, TypeScript e Vite**.

O comportamento central combina a API de eventos do navegador com uma arquitetura unidirecional:

- eventos `online` e `offline` representam mudanças de conectividade;
- o estado da aplicação reflete o valor de `navigator.onLine`;
- uma transição real gera um estado atômico composto por status atual, notificação temporária e histórico;
- a interface apresenta o status, informa transições recentes e registra eventos sem depender de requisições externas.

O diretório `no-harness/` contém o protótipo gerado sem as regras explicitadas do harness. O diretório `harness/` contém o contrato arquitetural, as invariantes e os gates automatizados que devem orientar e validar uma implementação compatível. O estado atual do repositório mostra `no-harness/src/` implementado, enquanto `harness/src/connectivity/`, `harness/src/hooks/` e `harness/src/components/` ainda não possuem módulos gerados.

## Estrutura do Repositório

```text
Practical-Project-AB2-PLP/
├── README.md
├── .github/
│   └── copilot-instructions.md
├── no-harness/
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   └── src/
│       ├── App.css
│       ├── App.test.tsx
│       ├── App.tsx
│       ├── index.css
│       ├── main.tsx
│       ├── assets/
│       │   ├── hero.png
│       │   ├── react.svg
│       │   └── vite.svg
│       ├── connectivity/
│       │   ├── ConnectionMonitor.test.ts
│       │   ├── ConnectionMonitor.ts
│       │   └── useConnectionMonitor.ts
│       └── test/
│           └── setup.ts
└── harness/
    ├── AGENTS.md
    ├── eslint.config.js
    ├── index.html
    ├── package.json
    ├── tsconfig.app.json
    ├── tsconfig.json
    ├── tsconfig.node.json
    ├── vite.config.ts
    ├── docs/
    │   └── invariants.md
    ├── public/
    │   ├── favicon.svg
    │   └── icons.svg
    ├── scripts/
    │   └── validate.mjs
    └── src/
        ├── App.css
        ├── index.css
        ├── main.tsx
        ├── components/
        ├── connectivity/
        ├── hooks/
        └── test/
            └── setup.ts
```

As pastas `node_modules/` e artefatos de build não aparecem na árvore por serem dependências ou produtos gerados, não fontes do projeto.

## Requisitos Funcionais

1. **Detecção de estado online/offline**
  - Ao iniciar, o status deve refletir `navigator.onLine`.
  - Os eventos de rede `online` e `offline` devem disparar transições no monitor.
  - Eventos redundantes não devem alterar estado nem criar novos registros.

2. **Exibição do estado atual**
- A interface deve mostrar claramente `Online` ou `Offline`.
  - O indicador deve possuir semântica acessível por meio de `role="status"`.

3. **Notificação temporária com cancelamento preemptivo**
- Uma transição real deve exibir uma notificação contextual, como `Conexão perdida` ou `Conexão restaurada`.
  - O banner deve ser mostrado por um período finito de 4000 ms por padrão.
  - Uma nova transição deve cancelar o temporizador anterior com `clearTimeout` antes de iniciar outro. Assim, oscilações rápidas não deixam a interface expirando a segunda notificação no prazo da primeira.

4. **Histórico LIFO de transições**
- Cada mudança real deve gerar um evento imutável.
  - O evento mais recente ocupa o índice `0`.
  - O histórico deve armazenar no máximo 10 itens.
  - A interface deve mostrar uma mensagem explícita quando não houver transições.

No protótipo `no-harness/`, esses comportamentos existem em parte: detecção, transições e histórico LIFO estão implementados, mas os testes reais confirmados não cobrem temporização, limite de 10 itens nem o contrato completo do harness. A implementação governada em `harness/` deve adicionar esses detalhes conforme `AGENTS.md` e `docs/invariants.md`.

## Arquitetura e Governança do Harness

### Arquitetura em camadas

| Camada | Responsabilidade e limites |
| --- | --- |
| `src/connectivity/` | Coordenador reativo puro: tipos de domínio, barramento pub/sub, status, notificações, timers, deduplicação e histórico. Apenas essa camada pode acessar `navigator.onLine`, `window.addEventListener` e `window.removeEventListener`. |
| `src/hooks/` | Adaptação ao ciclo de vida do React, especialmente `useConnectionMonitor`, com inscrição e cleanup determinístico. Não acessa APIs diretamente. |
| `src/components/` e `src/App.tsx` | Interface declarativa para indicador, banner e histórico. Consumem o snapshot entregue pelo hook e não mantêm cópias divergentes do estado. |
| `src/test/` e `*.test.{ts,tsx}` | Testes unitários do núcleo reativo e testes de integração da interface. |

### As 12 invariantes

- **INV-01 — Isolamento das APIs do navegador:** somente `src/connectivity/` pode usar `navigator.onLine` e os listeners globais.
- **INV-02 — Desacoplamento de framework:** `src/connectivity/` não importa React ou React DOM.
- **INV-03 — Tipagem estrita e imutabilidade:** contratos readonly, sem `any` ou casts inseguros.
- **INV-04 — Deduplicação por contagem de referências:** no máximo um listener `online` e um `offline`, independentemente do número de assinantes.
- **INV-05 — Reentrância no React StrictMode:** ciclos subscribe/unsubscribe/re-subscribe devem reanexar listeners corretamente.
- **INV-06 — Fonte única da verdade:** status, notificação e histórico são emitidos atomicamente por um unico coordenador.
- **INV-07 — Inicialização silenciosa:** boot reflete `navigator.onLine`, sem notificação ou evento falso no histórico.
- **INV-08 — Idempotência:** eventos repetidos para o estado atual não alteram nada nem reiniciam timers.
- **INV-09 — Cancelamento preemptivo:** transições substituem a notificação anterior e cancelam seu temporizador.
- **INV-10 — Histórico LIFO imutável e limitado:** novo evento no índice `0`, sem mutação dos arrays, com limite de 10 itens.
- **INV-11 — Cleanup determinístico:** desmontagem encerra assinaturas e timers sem efeitos residuais.
- **INV-12 — Integridade da governança:** proibidas supressões (`@ts-ignore`, `@ts-expect-error`, `eslint-disable`) e alterações das regras de governança.

### Bloqueios mecânicos

`harness/eslint.config.js` aplica regras recomendadas de JavaScript e TypeScript, restringe `any`, variáveis não utilizadas e React Hooks. Fora de `src/connectivity/`, `no-restricted-syntax` bloqueia chamadas a `window.addEventListener` e o uso de `navigator.onLine`. Tais regras tornam violações da INV-01 e da tipagem estrita erros de lint.

`harness/scripts/validate.mjs` verifica a existência de `AGENTS.md`, `docs/invariants.md`, `eslint.config.js`, `src/connectivity/` e arquivos `*.test.ts/tsx`. Também procura em todas as fontes `@ts-ignore`, `@ts-expect-error` e `eslint-disable`; qualquer ocorrência interrompe a validação. A funcionalidade arquitetural e de qualidade final permanece coberta em conjunto por lint, typecheck, testes e build.

## Como Executar e Validar

Instale as dependências separadamente em cada projeto:

```bash
cd no-harness
npm install
npm run dev
```

```bash
cd harness
npm install
npm run dev
```

### Scripts de `no-harness`

Executados dentro de `no-harness/`:

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm test
```

### Scripts de `harness`

Executados dentro de `harness/`:

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm test
npm run validate
npm run agent:check
npm run preview
```

O gate completo recomendado pelo projeto é:

```bash
cd harness
npm run agent:check
```

Esse comando encadeia exatamente `lint`, `typecheck`, `test`, `build` e `validate`, nessa ordem. A tarefa só deve ser considerada concluída com todas as etapas terminando em código de saída `0`.

Para executar etapas isoladas:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run validate
```

## Metodologia e Tabela Comparativa

O experimento deve registrar uma execução reproduzível para cada variante, com os mesmos prompt, requisitos funcionais e critérios de aceitação. Para cada ciclo de geração, anote o resultado dos gates, corrija quando necessário e registre quantas vezes o agente precisou intervir ou se autocorrigiu.

| Métrica | `no-harness` | `harness` |
| --- | --- | --- |
| Estado atual observado | `src/` implementado | contrato e governança presentes; `src/connectivity/`, `src/hooks/` e `src/components/` ainda vazios |
| Erros de compilação/lint | Não registrados nesta revisão | Não registrados; executar `npm run agent:check` após gerar `harness/src/` |
| Violações arquiteturais | Não avaliada pelo gate do harness | 0 esperado após a implementação; validar por `npm run validate` e pelas regras ESLint |
| Intervenções humanas | A preencher com o log do experimento | A preencher com o log do experimento |
| Ciclos de autocorreção | A preencher com o log do experimento | A preencher com o log do experimento |
| Cobertura funcional validada | unitários existentes para estado e transições básicas | Pendente: boot silencioso, transições, timers, preempção, LIFO 10, StrictMode, cleanup e 12 invariantes |

Os campos comparativos não devem ser estimados. Eles devem ser preenchidos após executar os experimentos e conservar os logs de erros, intervenções humanas e tentativas de correção. Na variante `harness/`, o resultado mínimo é `npm run agent:check` com exit code `0`.