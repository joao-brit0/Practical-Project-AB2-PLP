# Invariantes Arquiteturais

Todas as invariantes abaixo são obrigatórias e devem permanecer verdadeiras em qualquer estado do código.

---

## INV-01 — Isolamento das APIs de Conectividade do Navegador
Apenas módulos dentro de `src/connectivity/` podem ler `navigator.onLine` ou registrar/remover listeners `'online'` e `'offline'` em `window`. Camadas superiores (`src/hooks/`, `src/components/`, `src/App.tsx`) não podem acessar essas APIs.

```ts
// Proibido fora de src/connectivity/
window.addEventListener('offline', handler);
const initial = navigator.onLine;

// Permitido em hooks e componentes
const { status, notification, history } = useConnectionMonitor();
```

- **Verificação:** `npm run lint` (`no-restricted-syntax`).

---

## INV-02 — Desacoplamento de Framework na Camada Reativa
Módulos em `src/connectivity/` devem ser escritos em TypeScript puro, sem importar `react` ou `react-dom`. Toda lógica de barramento de eventos, máquina de estados, timers e histórico deve funcionar de forma independente da interface.

- **Verificação:** Testes unitários em `src/connectivity/` executados sem `render()`.

---

## INV-03 — Tipagem Estrita, Discriminada e Imutabilidade
Todos os contratos de domínio (`ConnectionStatus`, `ConnectionEvent`, `ConnectionNotification`, `ConnectionSnapshot`) devem usar tipos estritos e propriedades `readonly`. É proibido usar `any` ou casts inseguros (`as unknown as`).

- **Verificação:** `npm run typecheck` e `npm run lint` (`@typescript-eslint/no-explicit-any`).

---

## INV-04 — Deduplicação de Listeners Globais por Contagem de Referência
Independentemente de quantos hooks ou componentes estejam montados simultaneamente, deve existir **no máximo 1 listener ativo** para `'online'` e **1 listener ativo** para `'offline'` no `window`.
- Ao passar de `0` para `1` assinante ativo: registrar listeners no `window`.
- Ao passar de `1` para `0` assinantes ativos: remover listeners do `window` via `removeEventListener`.

```ts
subscribe(listener: SnapshotListener): () => void {
  this.listeners.add(listener);
  if (this.listeners.size === 1) {
    this.attachWindowListeners();
  }

  return () => {
    this.listeners.delete(listener);
    if (this.listeners.size === 0) {
      this.detachWindowListeners();
    }
  };
}
```

- **Verificação:** Teste unitário espionando `window.addEventListener` e `window.removeEventListener` com múltiplos assinantes.

---

## INV-05 — Reentrância em Ciclos de Montagem (React StrictMode)
O ciclo de inscrição e cancelamento (`subscribe` -> `unsubscribe` -> `subscribe`) deve ser reentrante. Se o último assinante cancelar a inscrição e um novo assinante se registrar em seguida (como ocorre no React 19 StrictMode), os listeners globais devem ser reanexados corretamente sem duplicação ou perda de eventos.

- **Verificação:** Testes de componente rodando sob `<StrictMode>` e ciclos consecutivos de montagem/desmontagem.

---

## INV-06 — Fonte Única da Verdade (Single Source of Truth)
O estado atual (`status`), a notificação ativa (`notification`) e o histórico (`history`) devem ser mantidos e emitidos de forma atômica por um único coordenador reativo em `src/connectivity/`. Componentes não podem manter cópias locais divergentes desses estados.

- **Verificação:** Testes de integração validando consistência simultânea entre indicador de status, banner de notificação e lista de histórico.

---

## INV-07 — Inicialização Silenciosa (Sem Transição Falsa no Boot)
Ao inicializar o monitor, `status` deve refletir o valor corrente de `navigator.onLine` (`'online'` ou `'offline'`), enquanto `notification` deve iniciar como `null` e `history` como `[]`. Notificações e registros de histórico só podem ser criados quando ocorrer uma mudança real de estado após a inicialização.

- **Verificação:** Teste unitário e de UI verificando o estado inicial antes de qualquer evento de rede.

---

## INV-08 — Idempotência de Eventos Redundantes
Se o estado atual já for `'online'` e um evento `'online'` for disparado (ou `'offline'` quando já está `'offline'`), o evento deve ser ignorado: não deve gerar registro no histórico, não deve criar notificação e não deve reiniciar timers existentes.

- **Verificação:** Teste unitário disparando eventos consecutivos idênticos.

---

## INV-09 — Cancelamento Preemptivo de Temporizadores de Notificação
Toda notificação exibida após uma transição de estado possui um temporizador finito de auto-ocultação. Se uma nova transição ocorrer enquanto uma notificação ainda estiver ativa, o `timeoutId` anterior deve ser cancelado via `clearTimeout` antes de agendar o novo temporizador.

- **Verificação:** Teste com `vi.useFakeTimers()` simulando alternância rápida (`offline -> online`) dentro da janela de exibição da notificação.

---

## INV-10 — Histórico Imutável, Cronológico Inverso (LIFO) e Limitado
O histórico de eventos deve ser atualizado de forma imutável (nunca usando `push`, `pop` ou `splice` no array exposto), mantendo o evento mais recente sempre no índice `0` e limitando a lista a **no máximo 10 itens**.

- **Verificação:** Teste unitário simulando mais de 10 transições consecutivas e validando tamanho máximo, ordenação e referência imutável.

---

## INV-11 — Cleanup Determinístico e Zero Efeitos Pós-Teardown
Todo timer pendente (`setTimeout`) e toda assinatura ativa devem ser encerrados no teardown/unmount. Após o último assinante desmontar ou o monitor ser encerrado, nenhum callback, atualização de estado ou timer residual pode ser executado.

- **Verificação:** Testes chamando `unmount()` seguidos de `vi.advanceTimersByTime()` e `window.dispatchEvent()`.

---

## INV-12 — Integridade da Governança e Proibição de Supressões
É proibido contornar regras de compilação, lint ou validação utilizando `@ts-ignore`, `@ts-expect-error`, `eslint-disable` ou modificando arquivos de governança (`AGENTS.md`, `docs/invariants.md`, `eslint.config.js`, `tsconfig*.json`, `package.json`, `scripts/validate.mjs`).

- **Verificação:** `npm run validate`.