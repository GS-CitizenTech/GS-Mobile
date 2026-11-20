# Migrations Oracle — Alerta Cidadão

## Mapeamento da coluna ATIVO

As propriedades `Usuario.Ativo` e `PontoMonitoramento.Ativo` são `bool` no modelo C# e são armazenadas no Oracle como `NUMBER(1)`.

O `AlertaCidadaoDbContext` deve manter o mapeamento abaixo, sem `HasConversion<int>()`:

```csharp
entity.Property(x => x.Ativo)
    .HasColumnName("ATIVO")
    .HasColumnType("NUMBER(1)")
    .HasDefaultValue(true);
```

A migration inicial, seus metadados (`.Designer.cs`) e o `AlertaCidadaoDbContextModelSnapshot` já representam essas colunas como `bool`, `NUMBER(1)` e valor padrão `true`. O mapeamento do contexto foi alinhado a esses arquivos para impedir que o EF gere `Column<int>` com valor padrão inteiro para uma coluna que o provider Oracle trata como Boolean.

## Local das migrations

As migrations oficiais deste projeto ficam em:

`src/AlertaCidadao.Infrastructure/Persistence/Migrations`

Não mantenha uma segunda pasta de migrations para o mesmo contexto, por exemplo `src/AlertaCidadao.Infrastructure/Migrations`, com outra `InitialCreate`.

## Executar a criação do schema

Abra o PowerShell em `API/src/AlertaCidadao.API`, confira se os User Secrets do projeto estão configurados (ConnectionStrings:Oracle e Jwt:SigningKey) e execute:

```powershell
dotnet ef database drop --force
dotnet ef database update
```

**Atenção:** `database drop` é destrutivo para o schema associado ao usuário Oracle da connection string. Use somente no ambiente/schema que pode ser recriado.
