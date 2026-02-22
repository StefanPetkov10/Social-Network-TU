using AutoMapper;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using NLog.Web;
using SocialMedia.AutoMapper;
using SocialMedia.Data.Repository;
using SocialMedia.Data.Repository.Interfaces;
using SocialMedia.Database;
using SocialMedia.Database.Models;
using SocialMedia.Extensions;
using SocialMedia.Hubs;
using SocialMedia.Services;
using SocialMedia.Services.Interfaces;
using SocialMedia.Validators;
using SocialMedia.Validators.CommentValidation;
using SocialMedia.Validators.GroupValidation;
using SocialMedia.Validators.PostValidation;
using SocialMedia.Validators.Profile_Validation;

namespace SocialMedia
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            builder.Logging.ClearProviders();
            builder.Logging.SetMinimumLevel(LogLevel.Information);
            builder.Host.UseNLog();

            builder.Services.AddDataProtection();

            builder.Services.AddSignalR();

            builder.Services.AddDbContext<SocialMediaDbContext>(options =>
                options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

            builder.Services.AddIdentity<ApplicationUser, IdentityRole<Guid>>(options =>
            {
                options.SignIn.RequireConfirmedEmail = true;
                ConfigureIdentityOptions(options, builder.Configuration);
            })
            .AddEntityFrameworkStores<SocialMediaDbContext>()
            .AddDefaultTokenProviders();

            builder.Services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme =
                options.DefaultChallengeScheme =
                options.DefaultForbidScheme =
                options.DefaultScheme =
                options.DefaultSignInScheme = JwtBearerDefaults.AuthenticationScheme;
            }).AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = builder.Configuration["JWT:Issuer"],
                    ValidateAudience = true,
                    ValidAudience = builder.Configuration["JWT:Audience"],
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(
                        System.Text.Encoding.UTF8.GetBytes(builder.Configuration["JWT:SecretKey"])
                    ),
                    ValidateLifetime = true
                };

                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var accessToken = context.Request.Query["access_token"];

                        var path = context.HttpContext.Request.Path;
                        if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs/chat"))
                        {
                            context.Token = accessToken;
                        }
                        return Task.CompletedTask;
                    }
                };
            });

            builder.Services.AddAuthorization(options =>
            {
                options.AddPolicy("RequireAdmin", policy => policy.RequireRole("Admin"));
                options.AddPolicy("ModOrAdmin", policy => policy.RequireRole("Moderator", "Admin"));
            });


            builder.Services.AddSwaggerGen(options =>
            {
                options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Description = "JWT Authorization header using the Bearer scheme.",
                    Name = "Authorization",
                    In = ParameterLocation.Header,
                    Type = SecuritySchemeType.ApiKey,
                    Scheme = "Bearer"
                });

                options.AddSecurityRequirement(new OpenApiSecurityRequirement
                 {
                     {
                         new OpenApiSecurityScheme
                         {
                             Reference = new OpenApiReference
                             {
                                 Type = ReferenceType.SecurityScheme,
                                 Id = "Bearer"
                             }
                         },
                         new string[] {}
                     }
                 });
            });

            builder.WebHost.ConfigureKestrel(options =>
            {
                options.Limits.MaxRequestBodySize = 104_857_600;
            });

            builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
            {
                options.MultipartBodyLengthLimit = 104_857_600;
            });

            builder.Services.AddMemoryCache();

            builder.Services.RegisterRepositories(typeof(ApplicationUser).Assembly);
            builder.Services.AddScoped<IRepository<GroupMembership, Guid>, BaseRepository<GroupMembership, Guid>>();
            builder.Services.RegisterUserDefinedServices(typeof(IProfileService).Assembly);
            builder.Services.AddScoped<ISearchService, SearchService>();

            builder.Services.AddAutoMapper(config =>
            {
                config.AddProfile<ProfileRegisterMapping>();
                config.AddProfile<ProfileMapping>();
                config.AddProfile<PostMapping>();
                config.AddProfile<FriendshipMapping>();
                config.AddProfile<FollowMapping>();
                config.AddProfile<GroupMapping>();
                config.AddProfile<CommentMapping>();
            });

            builder.Services.AddCors(options =>
            {
                options.AddPolicy("LocalDev", p => p
                    //.WithOrigins("http://localhost:3000")
                    .SetIsOriginAllowed(origin => true)
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials()
                );
            });

            builder.Services.AddAuthorization();
            builder.Services.AddControllers();

            builder.Services.RegisterValidatorsFromTypes(
                typeof(RegistrationValidator),
                typeof(UpdateProfileValidator),
                typeof(ChangePasswordValidator),
                typeof(CreatePostValidator),
                typeof(UpdatePostValidator),
                typeof(CreateGroupValidator),
                typeof(UpdateGroupValidator),
                typeof(CreateCommentValidator),
                typeof(UpdateCommentValidator)
           );

            builder.Services.AddFluentValidationAutoValidation();
            builder.Services.AddFluentValidationClientsideAdapters();

            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();



            var app = builder.Build();

            using (var scope = app.Services.CreateScope())
            {
                var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
                await RoleSeeder.SeedRolesAndAdminAsync(scope.ServiceProvider, config);
            }

            // Configure the HTTP request pipeline.  
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseCors("LocalDev");

            app.UseHttpsRedirection();

            app.UseAuthentication();
            app.UseAuthorization();

            app.UseStaticFiles(new StaticFileOptions
            {
                FileProvider = new PhysicalFileProvider(Path.Combine(Directory.GetCurrentDirectory(), "Uploads")),
                RequestPath = "/Uploads"
            });

            app.MapControllers();

            app.MapHub<ChatHub>("/hubs/chat");

            app.Run();
        }

        static void ConfigureIdentityOptions(IdentityOptions options, IConfiguration configuration)
        {
            options.Password.RequireLowercase = configuration.GetValue<bool>("Identity:Password:RequireLowercase");
            options.Password.RequireUppercase = configuration.GetValue<bool>("Identity:Password:RequireUppercase");
            options.Password.RequireNonAlphanumeric = configuration.GetValue<bool>("Identity:Password:RequireNonAlphanumeric");
            options.Password.RequiredLength = configuration.GetValue<int>("Identity:Password:RequiredLength");
            options.Password.RequiredUniqueChars = configuration.GetValue<int>("Identity:Password:RequiredUniqueChars");
            options.User.RequireUniqueEmail = configuration.GetValue<bool>("Identity:User:RequireUniqueEmail");
        }
    }
}

