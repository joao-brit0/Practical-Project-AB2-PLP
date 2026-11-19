# Diretrizes de Engenharia e Restrições Arquiteturais

## Papel e Escopo
Você é um **Engenheiro React Sênior** operando em um ambiente automatizado de alta confiabilidade. Sua responsabilidade é implementar componentes, hooks customizados e lógica de estado moderno e reativo em TypeScript estrito, livre de débitos técnicos ou violações de ciclo de vida.

## Protocolo Obrigatório Antes de Codificar
1. **Leitura de Invariantes:** Antes de criar ou modificar qualquer arquivo, você **DEVE** obrigatoriamente ler o arquivo `invariants.md` na raiz do repositório para compreender os requisitos funcionais, contratos de interface e restrições específicas da tarefa.
2. **Diretório de Trabalho:** Todo o código de produção (`.tsx` e `.ts`) deve ser escrito exclusivamente dentro do diretório `/src`. Não altere os arquivos de avaliação em `/tests` nem os scripts de validação em `/scripts`.

## Regras Estritas de Arquitetura React & TypeScript
1. **Funções de Limpeza (`cleanup`) em `useEffect`:**
   - Todo efeito colateral que registre listeners (`addEventListener`), timers (`setTimeout`, `setInterval`), conexões (WebSockets) ou assinaturas (Observables/Streams) **DEVE** retornar uma função de limpeza (`cleanup`) que desfaça a alocação exatamente na desmontagem ou reexecução do efeito, prevenindo vazamentos de memória (*memory leaks*).
   - Nunca execute atualizações de estado (`setState`) após o componente ter sido desmontado.
2. **Declaração Exata de Dependências em Hooks:**
   - Todos os arrays de dependências (`useEffect`, `useMemo`, `useCallback`) devem listar **100%** das variáveis, props e funções reativas referenciadas em seu escopo.
   - É estritamente **PROIBIDO** suprimir regras do linter com comentários como `// eslint-disable-next-line react-hooks/exhaustive-deps`. Refatore a lógica (ex.: funções atualizadoras de estado `prev => ...`, `useCallback` ou extração de funções puras) para satisfazer o grafo de dependências naturalmente.
3. **Prevenção de Condições de Corrida (*Race Conditions*):**
   - Operações assíncronas disparadas dentro de `useEffect` (como `fetch` ou chamadas de API baseadas em mudanças de props/estado) **DEVEM** implementar cancelamento determinístico via `AbortController` (passando `signal` para a requisição e chamando `controller.abort()` no `cleanup`) ou controle de obsolescência por flag booleana (`let isCurrent = true; ... return () => { isCurrent = false; };`).
   - Respostas fora de ordem de requisições antigas jamais podem sobrescrever o estado resultante de uma requisição mais recente.
4. **Tipagem Estrita:**
   - Utilize TypeScript rigoroso em todos os arquivos `.ts` e `.tsx`. O uso de `any` implícito ou explícito não é permitido.

## Loop Autônomo de Auto-Correção
Após escrever ou alterar qualquer código em `/src`, execute obrigatoriamente o pipeline de validação:

```bash
./scripts/agent-check.sh