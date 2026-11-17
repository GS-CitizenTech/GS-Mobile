using AlertaCidadao.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AlertaCidadao.Infrastructure.Persistence.Migrations;

[DbContext(typeof(AlertaCidadaoDbContext))]
[Migration("20261117140000_AddOcorrencia")]
public partial class AddOcorrencia : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "OCORRENCIA",
            columns: table => new
            {
                ID_OCORRENCIA = table.Column<decimal>(type: "NUMBER(20,0)", nullable: false)
                    .Annotation("Oracle:Identity", "START WITH 1 INCREMENT BY 1"),
                ID_USUARIO = table.Column<decimal>(type: "NUMBER(20,0)", nullable: false),
                ID_PONTO = table.Column<decimal>(type: "NUMBER(20,0)", nullable: true),
                TIPO = table.Column<string>(type: "NVARCHAR2(30)", maxLength: 30, nullable: false),
                TITULO = table.Column<string>(type: "NVARCHAR2(120)", maxLength: 120, nullable: false),
                DESCRICAO = table.Column<string>(type: "NVARCHAR2(1000)", maxLength: 1000, nullable: false),
                LOGRADOURO = table.Column<string>(type: "NVARCHAR2(180)", maxLength: 180, nullable: true),
                BAIRRO = table.Column<string>(type: "NVARCHAR2(100)", maxLength: 100, nullable: true),
                CIDADE = table.Column<string>(type: "NVARCHAR2(100)", maxLength: 100, nullable: true),
                UF = table.Column<string>(type: "CHAR(2)", nullable: true),
                LATITUDE = table.Column<decimal>(type: "NUMBER(9,6)", nullable: true),
                LONGITUDE = table.Column<decimal>(type: "NUMBER(9,6)", nullable: true),
                STATUS = table.Column<string>(type: "NVARCHAR2(20)", maxLength: 20, nullable: false, defaultValue: "ABERTA"),
                DATA_CRIACAO = table.Column<DateTimeOffset>(type: "TIMESTAMP WITH TIME ZONE", nullable: false, defaultValueSql: "SYSTIMESTAMP"),
                DATA_ATUALIZACAO = table.Column<DateTimeOffset>(type: "TIMESTAMP WITH TIME ZONE", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_OCORRENCIA", x => x.ID_OCORRENCIA);
                table.ForeignKey(
                    name: "FK_OCORRENCIA_USUARIO",
                    column: x => x.ID_USUARIO,
                    principalTable: "USUARIO",
                    principalColumn: "ID_USUARIO",
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_OCORRENCIA_PONTO",
                    column: x => x.ID_PONTO,
                    principalTable: "PONTO_MONITORAMENTO",
                    principalColumn: "ID_PONTO",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateIndex(
            name: "IX_OCORRENCIA_USUARIO_DATA",
            table: "OCORRENCIA",
            columns: new[] { "ID_USUARIO", "DATA_CRIACAO" });

        migrationBuilder.CreateIndex(
            name: "IX_OCORRENCIA_PONTO",
            table: "OCORRENCIA",
            column: "ID_PONTO");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "OCORRENCIA");
    }
}
