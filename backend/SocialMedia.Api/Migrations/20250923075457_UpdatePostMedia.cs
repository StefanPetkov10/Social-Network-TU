using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SocialMedia.Migrations
{
    /// <inheritdoc />
    public partial class UpdatePostMedia : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Url",
                table: "PostMedias",
                newName: "FilePath");

            migrationBuilder.RenameColumn(
                name: "SortOrder",
                table: "PostMedias",
                newName: "Order");

            migrationBuilder.Sql(
                @"ALTER TABLE ""PostMedias"" 
                 ALTER COLUMN ""MediaType"" TYPE integer 
                 USING (CASE 
                           WHEN ""MediaType"" = 'Image' THEN 0
                           WHEN ""MediaType"" = 'Video' THEN 1
                           WHEN ""MediaType"" = 'Document' THEN 2
                           WHEN ""MediaType"" = 'Gif' THEN 3
                           ELSE 99
                        END);");

            migrationBuilder.AlterColumn<int>(
                name: "MediaType",
                table: "PostMedias",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Order",
                table: "PostMedias",
                newName: "SortOrder");

            migrationBuilder.RenameColumn(
                name: "FilePath",
                table: "PostMedias",
                newName: "Url");

            migrationBuilder.AlterColumn<string>(
                name: "MediaType",
                table: "PostMedias",
                type: "text",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");
        }
    }
}
