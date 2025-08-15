using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SocialMedia.Migrations
{
    /// <inheritdoc />
    public partial class AddPostProperties : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedDate",
                table: "Profile",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedDate",
                table: "Profile",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "UpdatedDate",
                table: "Posts",
                type: "timestamp with time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AddColumn<int>(
                name: "CommentsCount",
                table: "Posts",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Posts",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "LikesCount",
                table: "Posts",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "MediaUrl",
                table: "Posts",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ProfileId",
                table: "Posts",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_Posts_ProfileId",
                table: "Posts",
                column: "ProfileId");

            migrationBuilder.AddForeignKey(
                name: "FK_Posts_Profile_ProfileId",
                table: "Posts",
                column: "ProfileId",
                principalTable: "Profile",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Posts_Profile_ProfileId",
                table: "Posts");

            migrationBuilder.DropIndex(
                name: "IX_Posts_ProfileId",
                table: "Posts");

            migrationBuilder.DropColumn(
                name: "CreatedDate",
                table: "Profile");

            migrationBuilder.DropColumn(
                name: "UpdatedDate",
                table: "Profile");

            migrationBuilder.DropColumn(
                name: "CommentsCount",
                table: "Posts");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Posts");

            migrationBuilder.DropColumn(
                name: "LikesCount",
                table: "Posts");

            migrationBuilder.DropColumn(
                name: "MediaUrl",
                table: "Posts");

            migrationBuilder.DropColumn(
                name: "ProfileId",
                table: "Posts");

            migrationBuilder.AlterColumn<DateTime>(
                name: "UpdatedDate",
                table: "Posts",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldNullable: true);
        }
    }
}
