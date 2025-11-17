using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SocialMedia.Migrations
{
    /// <inheritdoc />
    public partial class FixTablePasswordReset : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FailedAttempts",
                table: "PasswordResetSessions");

            migrationBuilder.DropColumn(
                name: "LockedUntil",
                table: "PasswordResetSessions");

            migrationBuilder.DropColumn(
                name: "OtpHash",
                table: "PasswordResetSessions");

            migrationBuilder.RenameColumn(
                name: "LastSentAt",
                table: "PasswordResetSessions",
                newName: "CreatedAt");

            migrationBuilder.AddColumn<string>(
                name: "EncodedIdentityToken",
                table: "PasswordResetSessions",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SessionTokenHash",
                table: "PasswordResetSessions",
                type: "character varying(128)",
                maxLength: 128,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EncodedIdentityToken",
                table: "PasswordResetSessions");

            migrationBuilder.DropColumn(
                name: "SessionTokenHash",
                table: "PasswordResetSessions");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "PasswordResetSessions",
                newName: "LastSentAt");

            migrationBuilder.AddColumn<int>(
                name: "FailedAttempts",
                table: "PasswordResetSessions",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "LockedUntil",
                table: "PasswordResetSessions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OtpHash",
                table: "PasswordResetSessions",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");
        }
    }
}
