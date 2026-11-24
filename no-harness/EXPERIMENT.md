# Experimento 1 — Sem Harness

## 1. Objetivo

Implementar um monitor de conexão utilizando um agente de IA sem fornecer regras arquiteturais específicas.

---

## 2. Prompt utilizado

```markdown
Crie uma aplicação web utilizando React + TypeScript + Vite chamada
"Reactive Connection Monitor".

O objetivo da aplicação é monitorar o estado da conexão de internet
do navegador e reagir às mudanças de conectividade.

## Requisitos funcionais

A aplicação deve:

1. Exibir claramente o estado atual da conexão:
   - ONLINE
   - OFFLINE

2. Detectar quando o navegador perde a conexão.

3. Detectar quando o navegador recupera a conexão.

4. Exibir uma notificação visual quando ocorrer uma mudança de estado.

5. Registrar um histórico das mudanças de conectividade.

6. Para cada evento registrado, exibir:
   - estado da conexão;
   - horário em que ocorreu.

7. O histórico deve permanecer disponível enquanto a aplicação estiver
   aberta.

8. A interface deve possuir um estado inicial coerente com o estado
   atual da conexão do navegador.

## Requisitos arquiteturais

A aplicação deve seguir uma arquitetura orientada a eventos e utilizar
os eventos de conectividade do navegador como fonte de eventos.

A interface de usuário não deve ser responsável diretamente por
gerenciar a infraestrutura de detecção da conexão.

A lógica relacionada à detecção e transformação dos eventos de
conectividade deve permanecer separada dos componentes de apresentação.

Os componentes de apresentação devem consumir o estado produzido pela
camada responsável pelo gerenciamento da conectividade.

Deve existir uma única fonte responsável por observar os eventos
"online" e "offline" do navegador.

Os componentes da interface não devem registrar múltiplos listeners
independentes para os mesmos eventos.

A solução deve evitar duplicação de lógica relacionada ao estado de
conectividade.

## Testes

Implemente testes automatizados para os principais comportamentos,
incluindo:

- estado inicial;
- transição ONLINE → OFFLINE;
- transição OFFLINE → ONLINE;
- geração de notificações;
- registro do histórico.

## Qualidade

Utilize TypeScript com tipagem adequada.

Não introduza bibliotecas de gerenciamento de estado sem necessidade.

Mantenha a solução simples e organizada.

Ao finalizar:

1. Execute os testes.
2. Execute o lint.
3. Execute o typecheck.
4. Execute o build.
5. Corrija os problemas encontrados antes de finalizar.

Não crie funcionalidades além das especificadas.
```

---

## 3. Implementação

- **Data:** 20/11/2026
- **Agente/modelo:** `mai-code-2-flash`
- **Tempo aproximado:** 5m 16s

A implementação foi gerada pelo agente a partir do prompt especificado acima.

A solução utiliza **React + TypeScript + Vite** e possui uma camada específica para gerenciamento da conectividade. A comunicação entre a camada de conectividade e a interface utiliza um modelo de estado observável, com `useSyncExternalStore` no lado do React.

A estrutura principal gerada foi:

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

---

## 4. Intervenções humanas

1. Definição do problema, dos requisitos funcionais e dos requisitos arquiteturais utilizados no prompt.
2. Análise da implementação gerada para verificar se os requisitos arquiteturais foram atendidos.
3. Análise dos testes e da cobertura da solução após a geração do projeto.

---

## 5. Problemas encontrados

### Funcionais

- Não foram identificados problemas funcionais relevantes na implementação analisada.
- A aplicação implementa o estado inicial da conexão, as transições `ONLINE → OFFLINE` e `OFFLINE → ONLINE`, as notificações e o histórico de alterações.
- O histórico permanece disponível enquanto a aplicação está aberta.

### Arquiteturais

- Não foi identificada uma violação arquitetural clara nos requisitos definidos.
- A implementação separa a observação dos eventos do navegador dos componentes de apresentação.
- Existe uma única instância responsável pelo monitoramento da conectividade.
- Os componentes React consomem o estado produzido pelo monitor por meio de `useSyncExternalStore`.
- A utilização de `window.addEventListener` dentro da camada de conectividade não foi considerada uma violação, pois a regra estabelecida era impedir que os componentes de apresentação gerenciassem diretamente esses eventos.
- Não foi implementado um mecanismo automático de validação da arquitetura.

### Testes

- Os principais comportamentos possuem testes automatizados.
- Existe cobertura para o estado inicial, transições de conectividade, histórico e notificações.
- Foi identificada uma lacuna de cobertura: não há um teste explícito verificando o comportamento de remoção dos *listeners* após a chamada de `stop()`.
- Também não existe um comando unificado de validação que execute todos os testes e verificações arquiteturais em conjunto.

### Qualidade

- A solução apresenta uma estrutura relativamente organizada e utiliza TypeScript adequadamente.
- A implementação evita a introdução desnecessária de bibliotecas de gerenciamento de estado.
- O código utiliza uma abstração para a fonte de eventos do navegador, facilitando os testes da lógica de conectividade.
- A principal limitação em relação ao experimento é a ausência de um Harness: as regras arquiteturais estão presentes apenas no prompt e não existem mecanismos persistentes no repositório para reforçá-las ou validá-las automaticamente.

---

## 6. Resultado das ferramentas

| Ferramenta | Status |
| :--- | :--- |
| **Testes** | `PASS` |
| **Lint** | `PASS` |
| **Typecheck** | `PASS` |
| **Build** | `PASS` |

---

## 7. Observações

- A implementação sem Harness apresentou uma arquitetura adequada mesmo sem mecanismos persistentes de orientação e validação no repositório.
- Isso é importante para a comparação experimental, pois evita concluir previamente que a ausência de Harness necessariamente produz uma implementação incorreta.
- As regras arquiteturais foram fornecidas diretamente ao agente por meio do prompt.
- O principal diferencial esperado do Harness será fornecer essas regras de forma persistente e adicionar mecanismos automatizados capazes de detectar violações.
- A ausência de um teste explícito para `stop()` representa uma oportunidade de melhoria na cobertura, mas não foi classificada como falha funcional.
- A ausência de um validador arquitetural não deve ser considerada uma falha da implementação sem Harness, pois a proposta do experimento é justamente comparar uma abordagem sem esse mecanismo com uma abordagem que possua Harness.