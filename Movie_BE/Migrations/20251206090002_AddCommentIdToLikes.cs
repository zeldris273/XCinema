using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddCommentIdToLikes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Likes_UserId_MovieId_TvSeriesId",
                table: "Likes");

            migrationBuilder.AddColumn<int>(
                name: "CommentId",
                table: "Likes",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Likes_CommentId",
                table: "Likes",
                column: "CommentId");

            migrationBuilder.CreateIndex(
                name: "IX_Likes_UserId_MovieId_TvSeriesId_CommentId",
                table: "Likes",
                columns: new[] { "UserId", "MovieId", "TvSeriesId", "CommentId" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Likes_Comments_CommentId",
                table: "Likes",
                column: "CommentId",
                principalTable: "Comments",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Likes_Comments_CommentId",
                table: "Likes");

            migrationBuilder.DropIndex(
                name: "IX_Likes_CommentId",
                table: "Likes");

            migrationBuilder.DropIndex(
                name: "IX_Likes_UserId_MovieId_TvSeriesId_CommentId",
                table: "Likes");

            migrationBuilder.DropColumn(
                name: "CommentId",
                table: "Likes");

            migrationBuilder.CreateIndex(
                name: "IX_Likes_UserId_MovieId_TvSeriesId",
                table: "Likes",
                columns: new[] { "UserId", "MovieId", "TvSeriesId" },
                unique: true);
        }
    }
}
