# AGENTS.md

## 1. Projeto e Escopo

Aplicação **Reactive Connection Monitor** em **React 19 + TypeScript + Vite** para monitoramento reativo de conectividade (`online` / `offline`), exibição do estado atual, notificação temporária de transição e histórico imutável de eventos.

### Limites de Arquivo
- **Permitido:** Criar e editar arquivos exclusivamente dentro de `harness/src/`.
- **Proibido:** Ler, copiar ou modificar qualquer arquivo em `no-harness/`.
- **Imutável:** Não alterar `AGENTS.md`, `docs/invariants.md`, `eslint.config.js`, `tsconfig*.json`, `package.json` ou `scripts/validate.mjs`.

---

## 2. Arquitetura em Camadas e Matriz de Dependências

A aplicação segue fluxo unidirecional orientado a eventos dividido em três camadas isoladas. Leia `docs/invariants.md` (`INV-01` a `INV-12`) antes de escrever código.

| Camada / Diretório | Responsabilidade | Imports Permitidos | Acesso a APIs do Navegador |
| :--- | :--- | :--- | :--- |
| `src/connectivity/` | Núcleo reativo puro: barramento pub/sub, máquina de estados, ref-counting de listeners, timers e histórico | Apenas TypeScript / stdlib (proibido importar `react`) | **Sim** (`navigator.onLine`, `window.addEventListener`, `window.removeEventListener`) |
| `src/hooks/` | Adaptação ao ciclo de vida do React com cleanup determinístico (`useConnectionMonitor`) | `react`, `src/connectivity/` | **Não** |
| `src/components/` e `src/App.tsx` | Interface declarativa (indicador de status, banner de notificação, lista de histórico) | `react`, `src/hooks/`, `src/connectivity/` (apenas tipos) | **Não** |
| `src/test/` e `*.test.{ts,tsx}` | Testes unitários do motor reativo e testes de integração da UI | `vitest`, `@testing-library/react`, camadas acima | Apenas mocks/spies de teste |

---

## 3. Contratos de Domínio (TypeScript Estrito)

Implemente e exporte estes contratos exatos em `src/connectivity/types.ts` (ou `src/connectivity/index.ts`):

```ts
export type ConnectionStatus = 'online' | 'offline';

export interface ConnectionEvent {
  readonly id: string;
  readonly type: 'CONNECTION_CHANGED';
  readonly previousStatus: ConnectionStatus;
  readonly currentStatus: ConnectionStatus;
  readonly timestamp: number;
}

export interface ConnectionNotification {
  readonly id: string;
  readonly status: ConnectionStatus;
  readonly message: string;
  readonly timestamp: number;
}

export interface ConnectionSnapshot {
  readonly status: ConnectionStatus;
  readonly notification: ConnectionNotification | null;
  readonly history: readonly ConnectionEvent[];
}

export type SnapshotListener = (snapshot: ConnectionSnapshot) => void;

export interface ConnectionMonitor {
  getSnapshot(): ConnectionSnapshot;
  subscribe(listener: SnapshotListener): () => void;
  destroy(): void;
}
```

---

## 4. Especificação Comportamental

1. **Inicialização Silenciosa (`INV-07`):**
   - `status` inicia refletindo `navigator.onLine ? 'online' : 'offline'`.
   - `notification` inicia como `null` e `history` inicia como `[]` (nenhum evento falso é registrado no boot).
2. **Transições Reais e Idempotência (`INV-08`):**
   - Somente mudanças reais (`online -> offline` ou `offline -> online`) atualizam `status`, geram uma `ConnectionNotification` e inserem um `ConnectionEvent` no histórico.
   - Eventos redundantes (`online -> online` ou `offline -> offline`) são ignorados sem efeitos colaterais.
3. **Notificação Temporária com Preempção (`INV-09`):**
   - Duração padrão da notificação: `4000ms` (configurável por parâmetro opcional na factory do monitor).
   - Se uma nova transição ocorrer enquanto existir um timer ativo, execute `clearTimeout` no timer anterior antes de agendar o novo.
4. **Histórico Imutável, LIFO e Limitado (`INV-10`):**
   - Máximo de `10` registros (`MAX_HISTORY_ITEMS = 10`).
   - Sempre ordenado do evento mais recente (índice `0`) para o mais antigo, atualizado sem mutação (`[newEvent, ...prevHistory].slice(0, 10)`).
5. **Deduplicação e Reentrância de Listeners (`INV-04`, `INV-05`):**
   - Anexar `'online'` e `'offline'` no `window` somente quando o número de assinantes passar de `0` para `1`.
   - Remover ambos via `window.removeEventListener` quando o número de assinantes cair de `1` para `0`.
   - Suportar múltiplos ciclos consecutivos de `subscribe` / `unsubscribe` (compatível com `<StrictMode>`).

---

## 5. Diretrizes de Interface e Acessibilidade

- **Indicador de Estado Atual:** Exibir claramente o estado atual (`Online` / `Offline`) com semântica acessível (`role="status"`).
- **Banner de Notificação:** Renderizar apenas quando `notification !== null`, utilizando `role="alert"` ou `aria-live="polite"`.
- **Histórico de Eventos:** Exibir lista ordenada da transição mais recente para a mais antiga, contendo direção da mudança (`offline -> online` ou `online -> offline`) e horário formatado, além de estado vazio explícito quando não houver transições registradas.

---

## 6. Proibições Explícitas

- **NÃO** use `window.addEventListener`, `window.removeEventListener` ou `navigator.onLine` fora de `src/connectivity/`.
- **NÃO** importe `react` ou `react-dom` dentro de `src/connectivity/`.
- **NÃO** use `any`, type assertions inseguras (`as unknown as`), `@ts-ignore`, `@ts-expect-error` ou `eslint-disable`.
- **NÃO** instale dependências externas adicionais.

---

## 7. Matriz Obrigatória de Testes

Implemente testes automatizados com **Vitest** e **Testing Library** cobrindo todos os cenários abaixo:

1. **Boot silencioso (`INV-07`):** Estado inicial `online` e `offline` sem notificação ativa e com histórico vazio.
2. **Transições bidirecionais (`INV-06`):** Eventos `offline` e `online` atualizando simultaneamente indicador de status, notificação e histórico.
3. **Auto-ocultação da notificação (`INV-09`):** Com `vi.useFakeTimers()`, validar que a notificação desaparece após `4000ms`.
4. **Preempção de timer em oscilação rápida (`INV-09`):** Disparar `offline`, avançar `2000ms`, disparar `online` e avançar mais `2000ms` — a segunda notificação deve continuar visível até completar seus próprios `4000ms`.
5. **Idempotência (`INV-08`):** Disparar dois eventos `'online'` seguidos (ou dois `'offline'`) não cria entradas duplicadas nem dispara notificações.
6. **Limite LIFO de 10 itens (`INV-10`):** Simular `12` transições alternadas e confirmar tamanho `10` com o evento mais recente no topo.
7. **Deduplicação e reentrância (`INV-04`, `INV-05`):** Montar múltiplos consumidores (e testar sob `<StrictMode>`) confirmando no máximo 1 listener `'online'` e 1 `'offline'` ativos no `window`.
8. **Cleanup no unmount (`INV-11`):** Desmontar componentes (`unmount()`), avançar timers e disparar eventos de rede confirmando remoção dos listeners e ausência de atualizações residuais.

---

## 8. Ordem de Implementação e Gate de Validação

1. Leia `docs/invariants.md`.
2. Implemente `src/connectivity/` (tipos, transições puras e monitor reativo).
3. Implemente `src/hooks/useConnectionMonitor.ts`.
4. Implemente os componentes em `src/components/` e integre em `src/App.tsx` + `src/App.css`.
5. Implemente os testes unitários em `src/connectivity/` e testes de interface em `src/App.test.tsx`.
6. Execute na pasta `harness/`:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run validate
```

Todas as 5 etapas devem passar com código de saída `0` antes de encerrar a tarefa.