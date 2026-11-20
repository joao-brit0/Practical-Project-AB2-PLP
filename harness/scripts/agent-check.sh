**`scripts/agent-check.sh`**
```bash
#!/usr/bin/env bash
set -uo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}[AGENT-CHECK] Iniciando validação arquitetural React + TypeScript...${NC}"

# ------------------------------------------------------------------------------
# Passo 1: Análise Estática (ESLint + React Hooks + Tipagem)
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}[PASSO 1/2] Executando ESLint em src/ (.ts, .tsx)...${NC}"
if ! npx eslint src/ --ext .ts,.tsx; then
  echo -e "\n${RED}====================================================================${NC}"
  echo -e "${RED}[FALHA NO PASSO 1] Violações de ESLint / Regras de React Hooks.${NC}"
  echo -e "${RED}====================================================================${NC}"
  echo -e "Instruções de Auto-Correção:"
  echo -e "1. Analise os erros reportados acima em /src."
  echo -e "2. Corrija todas as dependências ausentes ou incorretas em useEffect, useMemo e useCallback (react-hooks/exhaustive-deps)."
  echo -e "3. Garanta que nenhum Hook seja chamado condicionalmente (react-hooks/rules-of-hooks)."
  echo -e "4. Não utilize comentários 'eslint-disable'. Refatore o código e rode ./scripts/agent-check.sh novamente."
  exit 1
fi
echo -e "${GREEN}[PASSO 1/2] OK - Nenhuma violação de lint ou hooks encontrada.${NC}"

# ------------------------------------------------------------------------------
# Passo 2: Testes Comportamentais e de Ciclo de Vida (Jest + Testing Library)
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}[PASSO 2/2] Executando suíte de testes Jest em tests/...${NC}"
if ! npx jest tests/ --ci --forceExit; then
  echo -e "\n${RED}====================================================================${NC}"
  echo -e "${RED}[FALHA NO PASSO 2] Falha nos testes de componentes/hooks.${NC}"
  echo -e "${RED}====================================================================${NC}"
  echo -e "Instruções de Auto-Correção:"
  echo -e "1. Inspecione o stack trace e as asserções que falharam no log do Jest acima."
  echo -e "2. Verifique se há vazamentos de memória (timers/listeners ativos após unmount), falta de cleanup no useEffect ou condições de corrida (race conditions) em chamadas assíncronas."
  echo -e "3. Ajuste a implementação em /src (sem modificar /tests) e execute ./scripts/agent-check.sh novamente."
  exit 1
fi
echo -e "${GREEN}[PASSO 2/2] OK - Todos os testes passaram com sucesso.${NC}"

# ------------------------------------------------------------------------------
# Sucesso Total
# ------------------------------------------------------------------------------
echo -e "\n${GREEN}====================================================================${NC}"
echo -e "${GREEN}[SUCESSO - EXIT 0] Todas as verificações passaram perfeitamente.${NC}"
echo -e "${GREEN}====================================================================${NC}"
exit 0