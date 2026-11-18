using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AlertaCidadao.Infrastructure.Persistence.Migrations;

public sealed partial class AllowOccurrenceWithoutUserForAccountDeletion : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            "ALTER TABLE OCORRENCIA MODIFY (ID_USUARIO NULL)");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // O rollback só é possível se nenhuma ocorrência tiver sido anonimizada.
        migrationBuilder.Sql(
            "ALTER TABLE OCORRENCIA MODIFY (ID_USUARIO NOT NULL)");
    }
}
