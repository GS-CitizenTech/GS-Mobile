# Correção do erro Oracle NUMBER(1) / bool

## Erro identificado

O log recebido em 18/11/2026 mostra:

`System.InvalidCastException: Unable to cast object of type 'System.Int32' to type 'System.Boolean'`

A falha ocorre dentro de `OracleBoolTypeMapping.GenerateNonNullSqlLiteral`, antes de a consulta SQL ser enviada ao Oracle. O problema é a tradução, pelo provider Oracle EF Core, de filtros LINQ sobre propriedades `bool` convertidas para `NUMBER(1)`.

Rotas diretamente afetadas no código:
- `GET /api/pontos-monitoramento`: `PontoMonitoramentoRepository.ListarAtivosAsync`.
- Validação de ponto ativo usada no fluxo de leituras: `LeituraEnchenteRepository.PontoAtivoExisteAsync`.
- Listagem administrativa de usuários ativos: `UsuarioRepository.ListarAsync`.

## Correção aplicada

Os filtros `bool` foram movidos para memória, após carregar as linhas do banco. Os filtros por ID, código, datas e demais campos continuam sendo executados no Oracle.

Essa solução evita a expressão booleana que dispara a exceção do provider, mantendo o modelo e a coluna `ATIVO NUMBER(1)`.

## Observação de desempenho

A listagem de pontos e usuários agora carrega os registros antes de filtrar o campo `ATIVO`. É adequado para o volume pequeno esperado neste projeto. Se o volume crescer muito, a alternativa é mapear `ATIVO` como tipo numérico no modelo de persistência e converter para `bool` nos DTOs/serviços, para permitir filtro numérico no banco.

## Resultado do log sobre ocorrências

O arquivo de log recebido contém SELECTs bem-sucedidos na tabela `OCORRENCIA`, com JOINs em `USUARIO` e `PONTO_MONITORAMENTO`. Não há exceção de ocorrência nesse trecho. Portanto, não foi feita alteração no fluxo de CRUD de ocorrências sem evidência de falha.

## Testes pendentes no ambiente do projeto

Executar no diretório `API`:

```powershell
dotnet restore .\AlertaCidadao.sln
dotnet build .\AlertaCidadao.sln --no-restore
dotnet test .\AlertaCidadao.sln --no-build
```

Depois testar:
- `GET /api/pontos-monitoramento`
- `GET /api/leituras-enchente`
- `GET /api/ocorrencias`

A compilação e os testes precisam ser confirmados no ambiente com .NET SDK e acesso ao Oracle.
