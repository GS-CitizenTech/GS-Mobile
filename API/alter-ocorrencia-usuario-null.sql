-- Alerta Cidadao: permite excluir uma conta sem apagar ocorrencias historicas.
-- Execute uma unica vez no mesmo schema Oracle utilizado pela API.
-- A FK FK_OCORRENCIA_USUARIO permanece ativa; somente ID_USUARIO passa a aceitar NULL.

ALTER TABLE OCORRENCIA MODIFY (ID_USUARIO NULL);

-- Registra a migration quando o historico do EF Core existir neste schema.
DECLARE
    V_COUNT INTEGER;
BEGIN
    SELECT COUNT(*) INTO V_COUNT
      FROM USER_TABLES
     WHERE TABLE_NAME = '__EFMigrationsHistory';

    IF V_COUNT > 0 THEN
        EXECUTE IMMEDIATE
            'SELECT COUNT(*) FROM "__EFMigrationsHistory" WHERE "MigrationId" = ''20261118170000_AllowOccurrenceWithoutUserForAccountDeletion'''
            INTO V_COUNT;

        IF V_COUNT = 0 THEN
            EXECUTE IMMEDIATE
                'INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion") VALUES (''20261118170000_AllowOccurrenceWithoutUserForAccountDeletion'', ''9.0.0'')';
        END IF;
    END IF;
END;
/
COMMIT;

-- Conferencia da coluna apos a alteracao.
SELECT COLUMN_NAME, NULLABLE, DATA_TYPE, DATA_PRECISION, DATA_SCALE
FROM USER_TAB_COLUMNS
WHERE TABLE_NAME = 'OCORRENCIA'
  AND COLUMN_NAME = 'ID_USUARIO';
