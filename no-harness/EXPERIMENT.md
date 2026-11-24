# Experimento

## Experimento 1 — Sem Harness

### Objetivo

Implementar um monitor de conexão utilizando um agente
de IA sem fornecer regras arquiteturais específicas.

### Prompt utilizado

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

### Resultado

Implementação realizada pelo agente.

### Métricas

- Erros funcionais: 
- Violações arquiteturais:
- Testes faltantes:
- Erros de lint:
- Erros de TypeScript:
- Falhas de build:
- Intervenções humanas:
- Iterações com o agente:

### Observações

[Preencher após a análise]