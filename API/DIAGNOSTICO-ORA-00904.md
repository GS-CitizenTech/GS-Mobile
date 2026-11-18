# Diagnóstico do erro Oracle ORA-00904

O ORA-00904 indica que uma instrução SQL utilizou um identificador (normalmente uma coluna) que o Oracle não reconhece naquele objeto. A API agora grava a exceção completa no log do servidor, incluindo a mensagem Oracle, a rota e o TraceId, sem expor SQL ou detalhes internos ao aplicativo.

## 1. Conferir o schema usado pela API

No Oracle SQL Developer, conecte-se com o mesmo usuário/schema da connection string usada pela API e execute `diagnostico-schema-oracle.sql`.

Na seção **2**, procure linhas com `SITUACAO = AUSENTE`. Na seção **3**, confira os nomes e tipos reais das colunas. Isso permite detectar se o banco está em outro schema, se as tabelas são de uma versão antiga ou se há diferença de nomes.

## 2. Aplicar a correção conhecida

O `DbContext` atual mapeia `REQUISICAO_IDEMPOTENCIA.FINGERPRINT_HASH`, mas o `initial-create.sql` anterior não criava essa coluna. Se a coluna estiver ausente, execute `corrigir-fingerprint-oracle.sql` no schema da API. O script é idempotente: cria a coluna e registra a migration somente quando necessário.

## 3. Validar os endpoints

Depois de atualizar a API e reiniciá-la, valide nesta ordem pelo Swagger:

1. `GET /api/pontos-monitoramento`
2. `GET /api/leituras-enchente`
3. `GET /api/ocorrencias` com um JWT válido

Se algum endpoint continuar retornando `ORA-00904`, consulte o console/log da API e procure a mesma requisição pelo `TraceId`. A exceção completa agora deve indicar o identificador inválido. Não publique connection strings, tokens JWT ou senhas ao compartilhar os logs.

> Não execute `ALTER TABLE` manual para outras colunas apenas com base no nome do erro. Primeiro compare os resultados do diagnóstico e a coluna exata apresentada no log.
