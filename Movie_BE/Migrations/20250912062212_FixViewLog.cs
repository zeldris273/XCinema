using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class FixViewLog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_MovieViewLogs",
                table: "MovieViewLogs");

            migrationBuilder.RenameTable(
                name: "MovieViewLogs",
                newName: "ViewLogs");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ViewLogs",
                table: "ViewLogs",
                column: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_ViewLogs",
                table: "ViewLogs");

            migrationBuilder.RenameTable(
                name: "ViewLogs",
                newName: "MovieViewLogs");

            migrationBuilder.AddPrimaryKey(
                name: "PK_MovieViewLogs",
                table: "MovieViewLogs",
                column: "Id");
        }
    }
}
