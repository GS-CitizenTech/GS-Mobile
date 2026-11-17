# CRUD de Ocorrências

## Modelo de dados

A tabela `OCORRENCIA` registra os relatos enviados pelos usuários do Alerta Cidadão. Cada registro pertence ao usuário autenticado no JWT e pode, opcionalmente, estar vinculado a um ponto de monitoramento.

Campos principais:

- `ID_OCORRENCIA`: identificador gerado pelo Oracle.
- `ID_USUARIO`: proprietário do registro, obtido do token e nunca aceito do formulário.
- `ID_PONTO`: ponto de monitoramento relacionado, opcional.
- `TIPO`: `ALAGAMENTO`, `ENXURRADA`, `DESLIZAMENTO`, `BUEIRO_ENTUPIDO`, `RISCO_ESTRUTURAL` ou `OUTRO`.
- `TITULO` e `DESCRICAO`: identificação e detalhes do relato.
- Endereço e coordenadas: opcionais quando há ponto associado; sem ponto, deve ser informado ao menos um campo de endereço.
- `STATUS`: `ABERTA`, `EM_ANALISE`, `RESOLVIDA` ou `CANCELADA`.
- Datas de criação e atualização.

## Endpoints

Todos os endpoints exigem JWT.

| Método | Rota | Regra |
|---|---|---|
| GET | `/api/ocorrencias` | Cidadão vê as próprias; gestor vê todas. Aceita `status` e `idPonto`. |
| GET | `/api/ocorrencias/{id}` | Proprietário ou gestor. |
| POST | `/api/ocorrencias` | Cidadão ou gestor; proprietário vem do JWT; cria como `ABERTA`. |
| PUT | `/api/ocorrencias/{id}` | Proprietário pode editar enquanto `ABERTA`; gestor pode editar e mudar status. |
| DELETE | `/api/ocorrencias/{id}` | Proprietário pode excluir enquanto `ABERTA`; gestor pode excluir qualquer registro. |

O `POST`, `PUT` e `DELETE` aceitam o mecanismo de idempotência já usado nos demais endpoints.

## Segurança

- O cliente não envia `IdUsuario`; a API lê o `ClaimTypes.NameIdentifier` do JWT.
- A listagem de cidadão é filtrada no banco por `IdUsuario`.
- Consulta/alteração de registro de outro cidadão retorna 404, evitando revelar a existência do registro.
- Cidadãos não alteram o status e só editam/excluem registros em `ABERTA`.
- Gestores podem consultar e administrar todos os registros e definir o status.

## Oracle

Para um banco existente, executar `API/add-ocorrencia.sql` uma vez no mesmo schema configurado na connection string Oracle. O script é idempotente e registra a migration `20261117140000_AddOcorrencia` no histórico do EF Core quando a tabela de histórico existe.

Para novas instalações que executam `API/initial-create.sql`, a tabela e o registro de migration já estão incluídos.
