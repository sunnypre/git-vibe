using System.Text;
using GitVibe.Features.Shared;
using GitVibe.Infrastructure.Git;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Spectre.Console;

Console.OutputEncoding = Encoding.UTF8;

var builder = Host.CreateApplicationBuilder(args);

// Register services
builder.Services.AddSingleton<IGitProcess, GitProcess>();
builder.Services.AddSingleton<IGitService, GitService>();
builder.Services.AddHostedService<MainLoop>();

using var host = builder.Build();

await host.RunAsync();
