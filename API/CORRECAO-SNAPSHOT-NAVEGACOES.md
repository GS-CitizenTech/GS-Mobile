# Correção do ModelSnapshot: ordem das navegações

## Erro observado

Ao executar `dotnet ef database update`, o EF Core lançava:

`Navigation 'AlertaCidadao.Domain.Entities.PontoMonitoramento (Dictionary<string, object>).Ocorrencias' was not found.`

A falha ocorria durante `Migrator.HasPendingModelChanges()`, quando o EF Core reconstruía o `AlertaCidadaoDbContextModelSnapshot`.

## Causa

No snapshot e nos arquivos `.Designer.cs` das migrations mais recentes, blocos que chamavam `b.Navigation("Ocorrencias")` estavam posicionados antes do bloco que declara o relacionamento da entidade `Ocorrencia` com `PontoMonitoramento` e `Usuario` (`WithMany("Ocorrencias")`). Nesse momento da reconstrução do snapshot, a navegação ainda não havia sido declarada no modelo temporário do snapshot.

As navegações existem nas entidades do domínio e os relacionamentos já estavam mapeados no `AlertaCidadaoDbContext`; o problema era a ordem das declarações no código gerado de snapshot.

## Correção aplicada

- Reposicionados os blocos que contêm somente `b.Navigation(...)` para depois das declarações de relacionamento em `AlertaCidadaoDbContextModelSnapshot.cs`.
- Aplicada a mesma correção em todos os arquivos `*.Designer.cs` das migrations para que seus `TargetModel` também reconstruam o modelo na ordem correta.
- Preservadas as chamadas `HasOne`, `WithMany`, `WithOne`, chaves estrangeiras, nomes de constraints e operações `Up`/`Down`.
- Mantido o mapeamento das propriedades `Ativo` como `bool`, `NUMBER(1)` e default `true`; não deve existir `.HasConversion<int>()` nessas propriedades.
- Nenhuma migration nova foi criada e nenhuma tabela/coluna foi removida por esta correção.

## Como validar no ambiente do projeto

Abra o PowerShell em `API/src/AlertaCidadao.API` e execute:

```powershell
dotnet build ..\..\AlertaCidadao.sln
dotnet ef migrations has-pending-model-changes
```

Se a versão instalada do `dotnet-ef` não reconhecer `has-pending-model-changes`, execute diretamente:

```powershell
dotnet ef database update
```

Para recriar o schema do zero, somente quando estiver certo de que pode apagar os objetos do usuário Oracle configurado:

```powershell
dotnet ef database drop --force
dotnet ef database update
```

O ambiente em que este ZIP foi preparado não possui o SDK .NET nem conexão com o Oracle; por isso, a validação de compilação e execução das migrations deve ser concluída no computador que possui esses recursos.
