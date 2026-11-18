# Correção Oracle — solicitação de gestor

## Causa

A consulta `AnyAsync` em `SolicitacaoGestorRepository.ExistePendenteDoUsuarioAsync` fazia o provider Oracle gerar uma expressão `CASE ... THEN TRUE ELSE FALSE`. O Oracle retornou `ORA-00904: \"FALSE\": identificador inválido`.

## Correção

A verificação agora usa `CountAsync` e compara o resultado numérico com zero em memória. Isso mantém a regra de negócio (impedir mais de uma solicitação pendente por usuário) sem gerar literais booleanos no SQL. Nenhuma tabela ou dado Oracle precisa ser alterado.

## Arquivo alterado

`API/src/AlertaCidadao.Infrastructure/Repositories/SolicitacaoGestorRepository.cs`

## Validação

Execute na pasta `API`:

```powershell
dotnet build .\AlertaCidadao.sln
dotnet test .\AlertaCidadao.sln
```

Depois reinicie a API e tente enviar uma solicitação de gestor.
