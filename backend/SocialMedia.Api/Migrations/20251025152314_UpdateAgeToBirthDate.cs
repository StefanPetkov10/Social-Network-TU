using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SocialMedia.Migrations
{
    /// <inheritdoc />
    public partial class UpdateAgeToBirthDate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Age",
                table: "Profiles",
                newName: "BirthYear");

            migrationBuilder.AddColumn<int>(
                name: "BirthDay",
                table: "Profiles",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "BirthMonth",
                table: "Profiles",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BirthDay",
                table: "Profiles");

            migrationBuilder.DropColumn(
                name: "BirthMonth",
                table: "Profiles");

            migrationBuilder.RenameColumn(
                name: "BirthYear",
                table: "Profiles",
                newName: "Age");
        }
    }
}
