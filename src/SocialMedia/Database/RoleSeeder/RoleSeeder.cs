using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SocialMedia.Database;
using SocialMedia.Database.Models;

public static class RoleSeeder
{
    public static async Task SeedRolesAndAdminAsync(IServiceProvider services, IConfiguration config)
    {
        using var scope = services.CreateScope();

        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var db = scope.ServiceProvider.GetRequiredService<SocialMediaDbContext>();

        string[] roles = { "Admin", "Moderator", "User" };
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole<Guid>(role));
            }
        }

        var adminEmail = config["Admin:Email"];
        var adminPassword = config["Admin:Password"];
        var adminRole = config["Admin:Role"] ?? "Admin";
        var adminFullName = config["Admin:FullName"] ?? "System Administrator";
        var adminAvatar = config["Admin:AvatarUrl"];

        if (string.IsNullOrWhiteSpace(adminEmail) || string.IsNullOrWhiteSpace(adminPassword))
            return;

        var adminUser = await userManager.Users
            .Include(u => u.Profile)
            .FirstOrDefaultAsync(u => u.Email == adminEmail);

        if (adminUser == null)
        {
            adminUser = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                EmailConfirmed = true,
                Profile = new Profile
                {
                    FirstName = adminFullName,
                }
            };

            var create = await userManager.CreateAsync(adminUser, adminPassword);
            if (!create.Succeeded) return;
        }

        if (!await userManager.IsInRoleAsync(adminUser, adminRole))
        {
            await userManager.AddToRoleAsync(adminUser, adminRole);
        }

        await db.SaveChangesAsync();
    }
}