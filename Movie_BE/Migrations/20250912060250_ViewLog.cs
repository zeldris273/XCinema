using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class ViewLog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MovieViewLogs_Movies_MovieId",
                table: "MovieViewLogs");

            migrationBuilder.DropIndex(
                name: "IX_MovieViewLogs_MovieId",
                table: "MovieViewLogs");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "MovieViewLogs");

            migrationBuilder.RenameColumn(
                name: "MovieId",
                table: "MovieViewLogs",
                newName: "ContentId");

            migrationBuilder.AddColumn<string>(
                name: "ContentType",
                table: "MovieViewLogs",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ContentType",
                table: "MovieViewLogs");

            migrationBuilder.RenameColumn(
                name: "ContentId",
                table: "MovieViewLogs",
                newName: "MovieId");

            migrationBuilder.AddColumn<int>(
                name: "UserId",
                table: "MovieViewLogs",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_MovieViewLogs_MovieId",
                table: "MovieViewLogs",
                column: "MovieId");

            migrationBuilder.AddForeignKey(
                name: "FK_MovieViewLogs_Movies_MovieId",
                table: "MovieViewLogs",
                column: "MovieId",
                principalTable: "Movies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
