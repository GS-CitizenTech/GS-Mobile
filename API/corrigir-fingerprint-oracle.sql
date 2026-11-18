-- Corrige a divergencia conhecida entre o modelo EF Core e schemas criados
-- com uma versao anterior de API/initial-create.sql.
-- Execute no mesmo schema Oracle utilizado pela API.
-- O script pode ser executado mais de uma vez.

DECLARE
    v_tabela NUMBER := 0;
    v_coluna NUMBER := 0;
    v_historico NUMBER := 0;
    v_migration NUMBER := 0;
BEGIN
    SELECT COUNT(*)
      INTO v_tabela
      FROM USER_TABLES
     WHERE TABLE_NAME = 'REQUISICAO_IDEMPOTENCIA';

    IF v_tabela = 0 THEN
        DBMS_OUTPUT.PUT_LINE('Tabela REQUISICAO_IDEMPOTENCIA ausente. Nenhuma alteracao foi realizada.');
    ELSE
        SELECT COUNT(*)
          INTO v_coluna
          FROM USER_TAB_COLUMNS
         WHERE TABLE_NAME = 'REQUISICAO_IDEMPOTENCIA'
           AND COLUMN_NAME = 'FINGERPRINT_HASH';

        IF v_coluna = 0 THEN
            EXECUTE IMMEDIATE
                'ALTER TABLE "REQUISICAO_IDEMPOTENCIA" ADD ("FINGERPRINT_HASH" NVARCHAR2(64))';
            DBMS_OUTPUT.PUT_LINE('Coluna FINGERPRINT_HASH criada.');
        ELSE
            DBMS_OUTPUT.PUT_LINE('Coluna FINGERPRINT_HASH ja existe.');
        END IF;

        SELECT COUNT(*)
          INTO v_historico
          FROM USER_TABLES
         WHERE TABLE_NAME = '__EFMigrationsHistory';

        IF v_historico > 0 THEN
            EXECUTE IMMEDIATE
                'SELECT COUNT(*) FROM "__EFMigrationsHistory" WHERE "MigrationId" = ''20261111220000_AddIdempotencyFingerprint'''
                INTO v_migration;

            IF v_migration = 0 THEN
                EXECUTE IMMEDIATE
                    'INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion") VALUES (''20261111220000_AddIdempotencyFingerprint'', ''9.0.0'')';
                DBMS_OUTPUT.PUT_LINE('Migration AddIdempotencyFingerprint registrada.');
            ELSE
                DBMS_OUTPUT.PUT_LINE('Migration AddIdempotencyFingerprint ja registrada.');
            END IF;
        ELSE
            DBMS_OUTPUT.PUT_LINE('Tabela __EFMigrationsHistory ausente; a coluna foi corrigida, mas o historico nao foi atualizado.');
        END IF;
    END IF;
END;
/

COMMIT;

SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, DATA_LENGTH
  FROM USER_TAB_COLUMNS
 WHERE TABLE_NAME = 'REQUISICAO_IDEMPOTENCIA'
   AND COLUMN_NAME = 'FINGERPRINT_HASH';
