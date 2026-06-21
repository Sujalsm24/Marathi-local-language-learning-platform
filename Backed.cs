using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Google.Apis.Auth;

var builder = WebApplication.CreateBuilder(args);

// 1. SERVICES SETUP
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c => {
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Marathi Platform API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme {
        Description = "Type: Bearer {your_jwt_token}", Name = "Authorization", In = ParameterLocation.Header, Type = SecuritySchemeType.ApiKey, Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement { { new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } }, new string[] {} } });
});

// Configure Database Connection String directly
var connectionString = "Server=localhost;Database=MarathiLearningDb;Trusted_Connection=True;TrustServerCertificate=True;";
builder.Services.AddDbContext<AppDbContext>(options => options.UseSqlServer(connectionString));

// Setup Authentication Security Configurations
var jwtKey = "YourSuperSecretKeyThatIsLongEnough32Bytes!";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options => {
    options.TokenValidationParameters = new TokenValidationParameters {
        ValidateIssuer = false, ValidateAudience = false, ValidateLifetime = true, ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});

builder.Services.AddAuthorization();
builder.Services.AddCors(options => options.AddPolicy("AllowAll", p => p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));

var app = builder.Build();

// 2. MIDDLEWARES PIPELINE
if (app.Environment.IsDevelopment()) { app.UseSwagger(); app.UseSwaggerUI(); }
app.UseStaticFiles();
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();

// 3. REST ENDPOINTS / MINIMAL APIS ROUTES
app.MapPost("/api/auth/register", async (User user, AppDbContext db) => {
    user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(user.PasswordHash);
    db.Users.Add(user);
    await db.SaveChangesAsync();
    return Results.Ok(new { message = "Registered successfully" });
});

app.MapPost("/api/auth/login", (User loginDto, AppDbContext db) => {
    var user = db.Users.FirstOrDefault(u => u.Email == loginDto.Email);
    if (user == null || !BCrypt.Net.BCrypt.Verify(loginDto.PasswordHash, user.PasswordHash)) return Results.Unauthorized();
    
    var tokenHandler = new JwtSecurityTokenHandler();
    var tokenDescriptor = new SecurityTokenDescriptor {
        Subject = new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, user.UserID.ToString()), new Claim(ClaimTypes.Email, user.Email) }),
        Expires = DateTime.UtcNow.AddDays(7),
        SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)), SecurityAlgorithms.HmacSha256Signature)
    };
    return Results.Ok(new { Token = tokenHandler.WriteToken(tokenHandler.CreateToken(tokenDescriptor)), User = user.FullName });
});

app.MapGet("/api/lessons/{levelId}", async (int levelId, AppDbContext db) => {
    return Results.Ok(await db.Lessons.Where(l => l.LevelID == levelId).OrderBy(l => l.SequenceOrder).ToListAsync());
});

app.MapGet("/api/leaderboard", async (AppDbContext db) => {
    var topUsers = await db.UserProgresses.GroupBy(p => p.UserID).Select(g => new {
        UserId = g.Key,
        FullName = db.Users.Where(u => u.UserID == g.Key).Select(u => u.FullName).FirstOrDefault(),
        TotalPoints = g.Sum(p => p.QuizScore * 10)
    }).OrderByDescending(u => u.TotalPoints).Take(10).ToListAsync();
    return Results.Ok(topUsers);
});

app.Run();

// 4. DATA CONTEXT & ENTITIES DATA MODELS
public class AppDbContext : DbContext {
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) {}
    public DbSet<User> Users => Set<User>();
    public DbSet<Lesson> Lessons => Set<Lesson>();
    public DbSet<UserProgress> UserProgresses => Set<UserProgress>();
}

public class User {
    [Key] public int UserID { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
}

public class Lesson {
    [Key] public int LessonID { get; set; }
    public int LevelID { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int SequenceOrder { get; set; }
}

public class UserProgress {
    [Key] public int ProgressID { get; set; }
    public int UserID { get; set; }
    public int QuizScore { get; set; }
}
