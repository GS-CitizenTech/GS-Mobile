# Gestão administrativa de usuários

## Ativar ou desativar uma conta

Endpoint autenticado para o perfil `GESTOR`:

`PATCH /api/usuarios/{id}/status`

Corpo para desativar:

```json
{ "ativo": false }
```

Corpo para reativar:

```json
{ "ativo": true }
```

A própria conta do gestor não pode ser alterada por esse endpoint. O último gestor ativo também não pode ser desativado.

## Excluir permanentemente uma conta

`DELETE /api/usuarios/{id}`

A operação remove fisicamente o registro da tabela `USUARIO` e as solicitações de gestor em que a conta aparece como solicitante ou responsável pela decisão. Ocorrências são preservadas com `ID_USUARIO = NULL`, sem manter uma ligação à conta excluída. A própria conta e o último gestor ativo não podem ser excluídos.

Antes de executar a API atualizada em um banco já existente, execute uma vez `alter-ocorrencia-usuario-null.sql` no schema Oracle usado pela API. A migration `20261118170000_AllowOccurrenceWithoutUserForAccountDeletion` também representa essa alteração para instalações gerenciadas por migrations EF Core.

## Conta inativa

O login retorna HTTP 403 e `codigo = CONTA_INATIVA` somente quando o e-mail e a senha estão corretos e a conta está desativada. Senha incorreta ou e-mail inexistente continuam retornando HTTP 401.

Cada token também é revalidado contra o cadastro atual do usuário. Uma conta desativada ou excluída perde o acesso nas próximas requisições autenticadas. Após a reativação, o usuário deve entrar novamente para obter uma sessão nova.
