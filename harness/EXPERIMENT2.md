# Experimento 2 — Com Harness

## 1. Objetivo

Implementar o mesmo monitor de conexão utilizando um agente de IA orientado por um **Agent Harness** persistente (`AGENTS.md`, `docs/invariants.md`, regras estáticas de ESLint e script automatizado de validação arquitetural).

---

## 2. Prompt utilizado

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

---

## 3. Implementação

- **Data:** 25/11/2026
- **Agente/modelo:** `Copilot Fusion - Standard` (VS Code Copilot Chat em modo `Agent` / `Auto-approve`)
- **Tempo aproximado:** ~4min (início às 08:30, validação final concluída às 08:34)

Partindo exclusivamente dos arquivos de governança (`harness/AGENTS.md` e `harness/docs/invariants.md`), o agente inicializou o projeto Vite + TypeScript, configurou os bloqueios mecânicos (`eslint.config.js` e `scripts/validate.mjs`), implementou a arquitetura em camadas e executou o pipeline completo `npm run agent:check`.

A estrutura principal gerada em `harness/` foi:

```text
harness/
├── AGENTS.md
├── eslint.config.js
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
    ├── App.css
    ├── App.tsx
    ├── App.test.tsx
    ├── main.tsx
    ├── components/
    ├── connectivity/
    │   └── ConnectionMonitor.test.ts
    ├── hooks/
    │   └── useConnectionMonitor.ts
    └── test/
        └── setup.ts
```

---

## 4. Intervenções humanas

1. Escrita prévia dos documentos de contrato e governança (`harness/AGENTS.md` e `harness/docs/invariants.md`).
2. Envio do prompt inicial instruindo o agente a construir o setup, os gates mecânicos e a aplicação sob o contrato do harness.
3. Nenhuma intervenção manual no código-fonte gerado foi necessária durante ou após a execução do agente.
4. Verificação visual da interface em execução (`npm run dev`) simulando transições de rede pelo DevTools (`Network → Offline`).

---

## 5. Problemas encontrados

### Funcionais

- Não foram identificados problemas funcionais na implementação gerada.
- A aplicação inicia refletindo silenciosamente `navigator.onLine`, detecta transições reais `online → offline` e `offline → online`, exibe notificações temporárias por `4000ms` com cancelamento preemptivo via `clearTimeout` e mantém o histórico LIFO imutável limitado a `10` itens.

### Arquiteturais

- Não foram identificadas violações arquiteturais (`0` erros de lint e validação).
- O acesso às APIs do navegador (`navigator.onLine`, `window.addEventListener`, `window.removeEventListener`) ficou isolado exclusivamente em `src/connectivity/` (`INV-01`), sem importação de React nessa camada (`INV-02`).
- Diferente do Experimento 1 (`no-harness`), essas fronteiras arquiteturais são aplicadas mecanicamente por regras `no-restricted-syntax` no `harness/eslint.config.js` e verificadas a cada execução de `npm run agent:check`.

### Testes

- A suíte de testes gerada executou `2` arquivos de teste e `8` cenários com aprovação integral:
  - `src/connectivity/ConnectionMonitor.test.ts` (`6` testes unitários da camada reativa);
  - `src/App.test.tsx` (`2` testes de integração e comportamento da interface).
- Os testes cobrem boot silencioso, transições bidirecionais, auto-ocultação e preempção de timers (`vi.useFakeTimers()`), idempotência de eventos redundantes, limite LIFO de `10` itens, deduplicação de listeners sob `<StrictMode>` e cleanup determinístico no `unmount()`.

### Qualidade

- A solução utiliza TypeScript estrito com contratos imutáveis (`readonly`) e sem uso de `any` (`INV-03`).
- O script `scripts/validate.mjs` garante a integridade da estrutura do harness e bloqueia qualquer tentativa de supressão de erros via `@ts-ignore`, `@ts-expect-error` ou `eslint-disable` (`INV-12`).
- O comando unificado `npm run agent:check` encadeia `lint`, `typecheck`, `test`, `build` e `validate`, garantindo que nenhuma alteração futura quebre as invariantes sem bloquear o pipeline.

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

- **Comparação direta com o Experimento 1 (`no-harness`):** No Experimento 1, a organização arquitetural dependeu exclusivamente da obediência pontual do agente às instruções presentes no prompt, sem mecanismos persistentes para impedir regressões futuras. No Experimento 2, o **Agent Harness** persistiu o contrato no repositório (`AGENTS.md` e `docs/invariants.md`) e transformou as regras arquiteturais em bloqueios verificáveis automaticamente (`eslint.config.js` e `scripts/validate.mjs`).
- **Infraestrutura e escolha de modelo no modo Agent:** Durante a preparação do experimento, tentativas iniciais utilizando modelos do plano gratuito de API externa atingiram limites de taxa por minuto (`429 Too Many Requests` — limite de 5 requisições/minuto) devido ao alto volume de chamadas de ferramentas (*tool calling*) exigido por um fluxo autônomo. A troca para um modelo nativo integrado (`Copilot Fusion - Standard`) permitiu concluir todo o ciclo sem interrupções.
- **Comportamento de `navigator.onLine` no Windows:** Durante o teste manual no navegador, observou-se que desativar apenas o Wi-Fi físico ou ativar o Modo Avião no Windows não altera `navigator.onLine` quando há interfaces de rede virtuais ativas no sistema operacional (como adaptadores de WSL, Docker Desktop ou Hyper-V). A simulação direta pelo DevTools do navegador (`F12 → Network → Offline`) aciona os eventos nativos `offline` e `online` corretamente, confirmando o funcionamento reativo da interface.