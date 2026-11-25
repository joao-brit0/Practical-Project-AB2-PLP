# Experimento 2 — Com Harness

## 1. Objetivo

Implementar e evoluir iterativamente o monitor de conexão utilizando um agente de IA orientado por um **Agent Harness** persistente (`AGENTS.md`, `docs/invariants.md`, regras estáticas de ESLint e script automatizado de validação arquitetural).

---

## 2. Prompts utilizados

### Prompt 1 — Setup inicial, governança e implementação base

```markdown
Leia integralmente `harness/AGENTS.md` e `harness/docs/invariants.md` antes de criar ou editar qualquer arquivo.

Sem ler, copiar ou inspecionar nenhum arquivo dentro de `no-harness/`, construa o projeto **Reactive Connection Monitor** completo dentro de `harness/`:

### Fase 1 — Setup do Projeto e Infraestrutura do Harness
1. Inicialize uma aplicação **React + TypeScript + Vite** dentro de `harness/` e instale as dependências de teste e qualidade (`vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`).
2. Configure `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` e `vite.config.ts` (com ambiente `jsdom` para Vitest).
3. Configure `harness/eslint.config.js` com regras estritas proibindo `any`, bloqueando acesso a `navigator.onLine`, `window.addEventListener` e `window.removeEventListener` fora de `src/connectivity/`, e proibindo imports de `react` ou `react-dom` dentro de `src/connectivity/`.
4. Crie `harness/scripts/validate.mjs` verificando a existência dos arquivos obrigatórios (`AGENTS.md`, `docs/invariants.md`, `eslint.config.js`, `src/connectivity/`, arquivos `*.test.ts/tsx`) e bloqueando qualquer supressão (`@ts-ignore`, `@ts-expect-error`, `eslint-disable`) no código-fonte.
5. Configure `harness/package.json` com os scripts `dev`, `build`, `lint`, `typecheck`, `test`, `validate` e `agent:check` (encadeando `lint`, `typecheck`, `test`, `build` e `validate`).
6. Crie `.github/copilot-instructions.md` na raiz apontando para `harness/AGENTS.md` e `harness/docs/invariants.md`.

### Fase 2 — Implementação da Aplicação e Testes
Implemente o **Reactive Connection Monitor** exclusivamente dentro de `harness/src/`, cumprindo rigorosamente os contratos de domínio e todas as 12 invariantes (`INV-01` a `INV-12`):
- **Detecção (`src/connectivity/`):** TypeScript puro (sem React), refletindo `navigator.onLine` no boot silencioso (`INV-07`), deduplicando listeners globais por contagem de referências (`INV-04`, `INV-05`) e ignorando eventos redundantes (`INV-08`).
- **Notificações com Preempção (`src/connectivity/`):** Exibir notificação temporária por `4000ms` a cada transição real, cancelando o timer anterior com `clearTimeout` caso ocorra nova mudança antes de expirar (`INV-09`).
- **Histórico LIFO Limitado (`src/connectivity/`):** Lista imutável ordenada do evento mais recente (índice `0`) ao mais antigo, limitada a `10` itens (`INV-10`).
- **Hook e Interface (`src/hooks/`, `src/components/`, `src/App.tsx`):** Hook `useConnectionMonitor` com cleanup determinístico (`INV-11`) e UI declarativa/acessível exibindo estado atual (`role="status"`), banner de notificação (`role="alert"` ou `aria-live="polite"`) e histórico de eventos (com estado vazio explícito).
- **Testes (`harness/src/`):** Suíte completa com Vitest e Testing Library cobrindo todos os 8 cenários da matriz obrigatória de `AGENTS.md`.

### Restrições e Encerramento
- Nunca altere `harness/AGENTS.md` ou `harness/docs/invariants.md`.
- Ao finalizar, execute `npm run agent:check` dentro de `harness/` e corrija qualquer falha de lint, typecheck, testes, build ou validação até obter código de saída 0.
```

### Prompt 2 — Evolução iterativa para detecção híbrida (Heartbeat ativo via `fetch`)

```markdown
Leia integralmente `harness/AGENTS.md` e `harness/docs/invariants.md` antes de editar qualquer arquivo.

Aprimore a camada reativa em `harness/src/connectivity/` para suportar **detecção híbrida de conectividade** (eventos `online`/`offline` do `window` + sondagem periódica ativa via `fetch`), garantindo que quedas reais de Wi-Fi ou Modo Avião no Windows sejam detectadas mesmo quando `navigator.onLine` permanecer `true` por conta de adaptadores virtuais:

1. **Sondagem Ativa (`src/connectivity/ConnectionMonitor.ts`):**
   - Além dos listeners `'online'` e `'offline'`, adicione um heartbeat periódico opcional/configurável (padrão a cada `3000ms`, usando `fetch` com `mode: 'no-cors'`, `cache: 'no-store'` e `AbortController` com timeout).
   - Com `mode: 'no-cors'`, considere a conexão ativa sempre que a Promise do `fetch` resolver (mesmo com resposta opaca `status === 0`), e considere desconectada apenas quando a Promise rejeitar ou sofrer timeout.
   - Mantenha a inicialização silenciosa (`INV-07`): o status inicial continua vindo de `navigator.onLine` sem notificação ou evento no histórico.
   - Mantenha a contagem de referências e cleanup determinístico (`INV-04`, `INV-05`, `INV-11`): inicie o `setInterval` da sondagem somente quando os assinantes passarem de `0` para `1`, e execute `clearInterval` + `abort()` da requisição em andamento quando caírem de `1` para `0` ou em `destroy()`.
   - Mantenha a idempotência (`INV-08`): se o status já for `'online'` e o heartbeat confirmar `'online'` (ou já for `'offline'` e falhar novamente), não emita snapshot nem reinicie timers.

2. **Testes Automatizados (`src/test/setup.ts` e `src/connectivity/ConnectionMonitor.test.ts`):**
   - Configure um mock padrão de `globalThis.fetch` em `src/test/setup.ts` (resolvendo por padrão) para manter determinismo nos testes que avançam `vi.useFakeTimers()`.
   - Adicione testes unitários específicos validando: (a) transição para `'offline'` quando o `fetch` rejeita mesmo com `navigator.onLine === true`; (b) retorno para `'online'` quando o `fetch` volta a resolver; e (c) cancelamento do intervalo e do `AbortController` no `unsubscribe`/`destroy`.

Restrições:
- NÃO leia nem modifique `no-harness/`.
- NÃO altere `AGENTS.md`, `docs/invariants.md`, `eslint.config.js`, `tsconfig*.json`, `package.json` ou `scripts/validate.mjs`.

Execute `npm run agent:check` dentro de `harness/` e corrija qualquer falha até obter código de saída 0.
```

---

## 3. Implementação

- **Data:** 25/11/2026
- **Agente/modelo:** `Copilot Fusion - Standard` (VS Code Copilot Chat em modo `Agent` / `Autopilot`)
- **Tempo aproximado:**
  - **Ciclo 1 (Geração inicial):** ~4min (08:30 às 08:34)
  - **Ciclo 2 (Refinamento híbrido):** 1min 50s (20 passos executados pelo agente)

Partindo exclusivamente dos arquivos de governança (`harness/AGENTS.md` e `harness/docs/invariants.md`), o agente inicializou o projeto Vite + TypeScript, configurou os bloqueios mecânicos (`eslint.config.js` e `scripts/validate.mjs`), implementou a arquitetura em camadas e, na segunda iteração, incorporou a sondagem ativa via `fetch` mantendo todas as invariantes intactas.

A estrutura final gerada em `harness/` foi:

```text
harness/
├── AGENTS.md
├── eslint.config.js
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── docs/
│   └── invariants.md
├── scripts/
│   └── validate.mjs
└── src/
    ├── App.tsx
    ├── App.test.tsx
    ├── index.css
    ├── main.tsx
    ├── components/
    │   ├── ConnectionHistory.tsx
    │   ├── ConnectionNotification.tsx
    │   └── ConnectionStatus.tsx
    ├── connectivity/
    │   ├── ConnectionMonitor.test.ts
    │   ├── ConnectionMonitor.ts
    │   └── types.ts
    ├── hooks/
    │   └── useConnectionMonitor.ts
    └── test/
        └── setup.ts
```

---

## 4. Intervenções humanas

1. Escrita prévia dos documentos de contrato e governança (`harness/AGENTS.md` e `harness/docs/invariants.md`).
2. Envio do Prompt 1 para geração do projeto base, infraestrutura de validação e interface.
3. Teste manual no navegador (`npm run dev`), identificando que adaptadores virtuais do Windows mantinham `navigator.onLine === true` ao desligar o Wi-Fi físico.
4. Envio do Prompt 2 solicitando o mecanismo híbrido de sondagem ativa (`fetch` heartbeat) na camada `src/connectivity/`.
5. Nenhuma edição manual foi realizada no código-fonte gerado pelo agente em nenhum dos ciclos.

---

## 5. Problemas encontrados

### Funcionais

- Na primeira versão (baseada apenas nos eventos nativos `online`/`offline` e `navigator.onLine`), a aplicação funcionava conforme especificado na simulação via DevTools, mas não detectava a desconexão física do Wi-Fi ou Modo Avião no Windows devido às interfaces virtuais ativas no sistema operacional.
- Após o refinamento do Ciclo 2, o monitor passou a operar de forma híbrida: reage instantaneamente aos eventos do navegador e executa sondagem periódica leve (`fetch` a cada `3000ms` com `mode: 'no-cors'`, `cache: 'no-store'` e `AbortController`), detectando tanto desconexões físicas quanto quedas reais de acesso à rede sem comprometer a inicialização silenciosa (`INV-07`).

### Arquiteturais

- Não foram identificadas violações arquiteturais em nenhum dos dois ciclos (`0` erros de lint e validação).
- Mesmo após a adição da lógica assíncrona de sondagem (`setInterval`, `fetch`, `AbortController`), todo o controle permaneceu estritamente encapsulado em `src/connectivity/ConnectionMonitor.ts` (`INV-01` e `INV-02`), sem vazar efeitos colaterais ou dependências de rede para `src/hooks/` ou `src/components/`.
- O ciclo de vida do heartbeat respeitou a contagem de referências (`INV-04`, `INV-05`) e o cleanup determinístico (`INV-11`), iniciando o intervalo apenas quando o primeiro assinante se conecta e abortando requisições pendentes no `unsubscribe`/`destroy`.

### Testes

- A suíte automatizada cobre tanto os 8 cenários originais da matriz de `AGENTS.md` quanto os novos cenários de sondagem ativa:
  - `src/connectivity/ConnectionMonitor.test.ts`: testes unitários cobrindo boot silencioso, transições via eventos `window`, auto-ocultação e preempção de timers (`4000ms` com `clearTimeout`), idempotência, limite LIFO de `10` itens, deduplicação por contagem de referências, queda/recuperação detectada via rejeição/resolução de `fetch` mesmo com `navigator.onLine === true`, e abort de requisições no teardown.
  - `src/App.test.tsx`: testes de integração da interface com Testing Library validando acessibilidade (`role="status"`), banners temporários e histórico sob `<StrictMode>`.
  - `src/test/setup.ts`: configurado com mock padrão determinístico de `globalThis.fetch` para evitar interferência em testes baseados em `vi.useFakeTimers()`.

### Qualidade

- Tipagem estrita em TypeScript sem uso de `any` ou casts inseguros (`INV-03`).
- Governança preservada integralmente pelo script `scripts/validate.mjs` (`INV-12`), sem supressões (`@ts-ignore`, `@ts-expect-error`, `eslint-disable`) e sem alterações nos arquivos de regras.
- O pipeline `npm run agent:check` (`lint && typecheck && test && build && validate`) validou todas as alterações automaticamente com código de saída `0`.

---

## 6. Resultado das ferramentas

| Ferramenta | Status |
| :--- | :--- |
| **Lint (`npm run lint`)** | `PASS` |
| **Typecheck (`npm run typecheck`)** | `PASS` |
| **Testes (`npm test`)** | `PASS` |
| **Build (`npm run build`)** | `PASS` |
| **Validação Arquitetural (`npm run validate`)** | `PASS` |
| **Gate Completo (`npm run agent:check`)** | `PASS` |

---

## 7. Observações

- **Valor do Harness na evolução iterativa:** O principal ganho prático observado neste experimento ocorreu no **Ciclo 2**. Ao solicitar uma mudança não trivial na lógica de detecção (sondagem periódica assíncrona com `fetch` e `AbortController`), o **Agent Harness** garantiu que o agente não violasse o isolamento de camadas, não quebrasse o comportamento em React `<StrictMode>` e não deixasse timers ou requisições pendentes após a desmontagem — tudo verificado automaticamente pelo `npm run agent:check`.
- **Comparação direta com o Experimento 1 (`no-harness`):** Enquanto no Experimento 1 a aderência arquitetural existia apenas no contexto volátil do prompt inicial, no Experimento 2 as regras persistentes (`AGENTS.md`, `invariants.md`, `eslint.config.js` e `validate.mjs`) atuaram como salvaguardas contínuas durante a criação e a evolução do software.
- **Comportamento de `navigator.onLine` no Windows e solução híbrida:** No Windows, adaptadores virtuais criados por WSL, Docker Desktop ou Hyper-V mantêm o estado lógico da rede ativo para o navegador mesmo quando o Wi-Fi físico é desligado ou o Modo Avião é ativado. A combinação entre listeners de eventos do navegador e heartbeat via `fetch` resolveu essa limitação mantendo a aplicação fiel ao modelo reativo.
- **Escolha de modelo no modo Agent:** Tentativas iniciais com modelos de cota gratuita via API externa sofreram bloqueio de taxa (`429 Too Many Requests` — limite de 5 requisições/minuto) devido ao alto volume de chamadas de ferramentas (*tool calling*) do fluxo autônomo. O uso de um modelo nativo integrado (`Copilot Fusion - Standard`) permitiu executar ambos os ciclos sem interrupções.