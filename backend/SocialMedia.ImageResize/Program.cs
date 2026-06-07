using Azure.Storage.Blobs;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var host = new HostBuilder()
    .ConfigureFunctionsWorkerDefaults()
    .ConfigureServices(services =>
    {
        services.AddApplicationInsightsTelemetryWorkerService();
        services.ConfigureFunctionsApplicationInsights();

        services.AddSingleton(sp =>
        {
            var connectionString = Environment.GetEnvironmentVariable("BlobStorageConnection");
            return new BlobServiceClient(connectionString);
        });
    })
    .Build();

host.Run();