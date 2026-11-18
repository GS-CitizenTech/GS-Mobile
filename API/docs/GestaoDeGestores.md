# Gestão de gestores e acesso administrativo

## Fluxo de cadastro

1. O primeiro gestor continua sendo provisionado pela ferramenta `AlertaCidadao.AdminBootstrap`.
2. Na tela pública de cadastro, o usuário pode escolher **Cadastrar como cidadão** ou **Cadastrar como gestor**.
3. Ao escolher gestor, a conta é criada inicialmente como `CIDADAO` e uma solicitação `PENDENTE` é enviada com autenticação.
4. Um gestor ativo analisa a solicitação no painel **Gestão > Solicitações de gestor**.
5. Ao aprovar, a API altera `USUARIO.PERFIL` para `GESTOR`. O usuário aprovado precisa sair e entrar novamente para receber um JWT com o perfil atualizado.
6. Um gestor também pode cadastrar diretamente outro gestor pela opção **Cadastrar outro gestor**. Esse endpoint exige JWT com role `GESTOR`.

A seleção feita no cadastro público nunca concede privilégios por conta própria. A aprovação administrativa é obrigatória. Se um pedido for rejeitado, o cidadão poderá enviar uma nova solicitação pela tela de acesso de gestor no perfil.

## Preparação do Oracle

Execute uma única vez no schema utilizado pela API:

```sql
@add-solicitacao-gestor.sql
```

O script cria `SOLICITACAO_GESTOR`, suas chaves estrangeiras e índices, incluindo um índice único funcional que impede múltiplas solicitações pendentes simultâneas para o mesmo usuário. Não recria nem altera as tabelas existentes do Alerta Cidadão.

## Endpoints novos

| Método | Rota | Permissão | Finalidade |
|---|---|---|---|
| POST | `/api/usuarios/gestores` | GESTOR | Criar outro gestor diretamente |
| POST | `/api/usuarios/solicitacoes-gestor` | Usuário autenticado | Solicitar acesso |
| GET | `/api/usuarios/solicitacoes-gestor/minha` | Usuário autenticado | Consultar própria solicitação |
| GET | `/api/usuarios/solicitacoes-gestor?status=PENDENTE` | GESTOR | Listar pedidos |
| PUT | `/api/usuarios/solicitacoes-gestor/{id}` | GESTOR | Aprovar ou rejeitar |

## Painel do gestor no mobile

O painel reúne indicadores e atalhos para administrar ocorrências, pontos de monitoramento, leituras, alertas, usuários e solicitações de acesso. As operações de escrita continuam protegidas pela política `Gestor` na API.

## Primeiro gestor do ambiente

O fluxo público de cadastro não concede perfil `GESTOR` automaticamente. Para habilitar as primeiras aprovações, o ambiente precisa ter pelo menos um gestor inicial criado pela ferramenta administrativa `tools/AlertaCidadao.AdminBootstrap`. Depois disso, esse gestor pode aprovar solicitações enviadas pelo aplicativo ou cadastrar outro gestor diretamente.
