-- Execute este arquivo no Oracle SQL Developer conectado com o MESMO schema
-- utilizado pela API AlertaCidadao.
-- O resultado mostra se as tabelas/colunas esperadas pelo EF Core existem.

SET PAGESIZE 200
SET LINESIZE 220

PROMPT === 1. Tabelas esperadas ===
SELECT tabela.table_name,
       CASE WHEN existente.table_name IS NULL THEN 'AUSENTE' ELSE 'OK' END AS situacao
  FROM (
        SELECT 'USUARIO' table_name FROM dual UNION ALL
        SELECT 'PONTO_MONITORAMENTO' FROM dual UNION ALL
        SELECT 'LEITURA_ENCHENTE' FROM dual UNION ALL
        SELECT 'ALERTA' FROM dual UNION ALL
        SELECT 'OCORRENCIA' FROM dual UNION ALL
        SELECT 'REQUISICAO_IDEMPOTENCIA' FROM dual UNION ALL
        SELECT '__EFMigrationsHistory' FROM dual
       ) tabela
  LEFT JOIN USER_TABLES existente
    ON existente.table_name = tabela.table_name
 ORDER BY tabela.table_name;

PROMPT === 2. Colunas esperadas pelas telas de pontos, leituras e ocorrencias ===
WITH colunas_esperadas (table_name, column_name) AS (
    SELECT 'PONTO_MONITORAMENTO', 'ID_PONTO' FROM dual UNION ALL
    SELECT 'PONTO_MONITORAMENTO', 'CODIGO' FROM dual UNION ALL
    SELECT 'PONTO_MONITORAMENTO', 'NOME' FROM dual UNION ALL
    SELECT 'PONTO_MONITORAMENTO', 'DESCRICAO' FROM dual UNION ALL
    SELECT 'PONTO_MONITORAMENTO', 'LOGRADOURO' FROM dual UNION ALL
    SELECT 'PONTO_MONITORAMENTO', 'BAIRRO' FROM dual UNION ALL
    SELECT 'PONTO_MONITORAMENTO', 'CIDADE' FROM dual UNION ALL
    SELECT 'PONTO_MONITORAMENTO', 'UF' FROM dual UNION ALL
    SELECT 'PONTO_MONITORAMENTO', 'LATITUDE' FROM dual UNION ALL
    SELECT 'PONTO_MONITORAMENTO', 'LONGITUDE' FROM dual UNION ALL
    SELECT 'PONTO_MONITORAMENTO', 'ATIVO' FROM dual UNION ALL
    SELECT 'PONTO_MONITORAMENTO', 'DATA_CADASTRO' FROM dual UNION ALL
    SELECT 'LEITURA_ENCHENTE', 'ID_LEITURA' FROM dual UNION ALL
    SELECT 'LEITURA_ENCHENTE', 'ID_PONTO' FROM dual UNION ALL
    SELECT 'LEITURA_ENCHENTE', 'NIVEL_AGUA_CM' FROM dual UNION ALL
    SELECT 'LEITURA_ENCHENTE', 'CHUVA_MM' FROM dual UNION ALL
    SELECT 'LEITURA_ENCHENTE', 'ELEVACAO_CM_H' FROM dual UNION ALL
    SELECT 'LEITURA_ENCHENTE', 'DATA_HORA_LEITURA' FROM dual UNION ALL
    SELECT 'LEITURA_ENCHENTE', 'ORIGEM' FROM dual UNION ALL
    SELECT 'LEITURA_ENCHENTE', 'CHAVE_EVENTO' FROM dual UNION ALL
    SELECT 'LEITURA_ENCHENTE', 'DATA_RECEBIMENTO' FROM dual UNION ALL
    SELECT 'OCORRENCIA', 'ID_OCORRENCIA' FROM dual UNION ALL
    SELECT 'OCORRENCIA', 'ID_USUARIO' FROM dual UNION ALL
    SELECT 'OCORRENCIA', 'ID_PONTO' FROM dual UNION ALL
    SELECT 'OCORRENCIA', 'TIPO' FROM dual UNION ALL
    SELECT 'OCORRENCIA', 'TITULO' FROM dual UNION ALL
    SELECT 'OCORRENCIA', 'DESCRICAO' FROM dual UNION ALL
    SELECT 'OCORRENCIA', 'LOGRADOURO' FROM dual UNION ALL
    SELECT 'OCORRENCIA', 'BAIRRO' FROM dual UNION ALL
    SELECT 'OCORRENCIA', 'CIDADE' FROM dual UNION ALL
    SELECT 'OCORRENCIA', 'UF' FROM dual UNION ALL
    SELECT 'OCORRENCIA', 'LATITUDE' FROM dual UNION ALL
    SELECT 'OCORRENCIA', 'LONGITUDE' FROM dual UNION ALL
    SELECT 'OCORRENCIA', 'STATUS' FROM dual UNION ALL
    SELECT 'OCORRENCIA', 'DATA_CRIACAO' FROM dual UNION ALL
    SELECT 'OCORRENCIA', 'DATA_ATUALIZACAO' FROM dual UNION ALL
    SELECT 'REQUISICAO_IDEMPOTENCIA', 'FINGERPRINT_HASH' FROM dual
)
SELECT esperado.table_name,
       esperado.column_name,
       CASE WHEN real.column_name IS NULL THEN 'AUSENTE' ELSE 'OK' END AS situacao,
       real.data_type,
       real.data_length,
       real.data_precision,
       real.data_scale
  FROM colunas_esperadas esperado
  LEFT JOIN USER_TAB_COLUMNS real
    ON real.table_name = esperado.table_name
   AND real.column_name = esperado.column_name
 ORDER BY esperado.table_name, esperado.column_name;

PROMPT === 3. Colunas reais das tabelas consultadas ===
SELECT table_name,
       column_id,
       column_name,
       data_type,
       data_length,
       data_precision,
       data_scale,
       nullable
  FROM USER_TAB_COLUMNS
 WHERE table_name IN (
       'PONTO_MONITORAMENTO',
       'LEITURA_ENCHENTE',
       'OCORRENCIA',
       'REQUISICAO_IDEMPOTENCIA'
 )
 ORDER BY table_name, column_id;

PROMPT === 4. Conferir se a tabela de historico existe ===
SELECT COUNT(*) AS HISTORICO_MIGRATIONS_EXISTE
  FROM USER_TABLES
 WHERE TABLE_NAME = '__EFMigrationsHistory';

-- Se o resultado acima for 1, consulte o historico com:
-- SELECT "MigrationId", "ProductVersion"
--   FROM "__EFMigrationsHistory"
--  ORDER BY "MigrationId";
