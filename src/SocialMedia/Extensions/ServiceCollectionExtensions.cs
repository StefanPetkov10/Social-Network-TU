using System.Reflection;
using SocialMedia.Data.Repository;
using SocialMedia.Data.Repository.Interfaces;
using SocialMedia.Database.Models;

namespace SocialMedia.Extensions
{
    public static class ServiceCollectionExtensions
    {
        public static void RegisterRepositories(this IServiceCollection services, Assembly modelsAssembly)
        {
            Type[] typesToExclude = new Type[] { typeof(ApplicationUser) };
            Type[] modelTypes = modelsAssembly
                .GetTypes()
                .Where(t => !t.IsAbstract && !t.IsInterface &&
                !t.IsEnum &&
                !t.Name.ToLower().EndsWith("attribute"))
                .ToArray();

            foreach (Type type in modelTypes)
            {
                if (!typesToExclude.Contains(type))
                {
                    Type repositoryInterface = typeof(IRepository<,>);
                    Type repositoryInstanceType = typeof(BaseRepository<,>);
                    PropertyInfo? idPropInfo = type
                        .GetProperties()
                        .Where(p => p.Name.ToLower() == "id")
                        .SingleOrDefault();

                    Type[] constructArgs = new Type[2];
                    constructArgs[0] = type;

                    if (idPropInfo == null)
                    {
                        constructArgs[1] = typeof(object);
                    }
                    else
                    {
                        constructArgs[1] = idPropInfo.PropertyType;
                    }

                    repositoryInterface = repositoryInterface.MakeGenericType(constructArgs);
                    repositoryInstanceType = repositoryInstanceType.MakeGenericType(constructArgs);

                    services.AddScoped(repositoryInterface, repositoryInstanceType);
                }
            }
        }

        public static void RegisterUserDefinedServices(this IServiceCollection services, Assembly serviceAssembly)
        {
            Type[] serviceInterfaceTypes = serviceAssembly
                .GetTypes()
                .Where(t => t.IsInterface && t.Name.ToLower().EndsWith("service"))
                .ToArray();
            Type[] serviceTypes = serviceAssembly
                .GetTypes()
                .Where(t => !t.IsInterface && !t.IsAbstract &&
                                t.Name.ToLower().EndsWith("service"))
                .ToArray();

            foreach (Type serviceInterfaceType in serviceInterfaceTypes)
            {
                Type? serviceType = serviceTypes
                    .SingleOrDefault(t => "i" + t.Name.ToLower() == serviceInterfaceType.Name.ToLower());
                if (serviceType == null)
                {
                    throw new NullReferenceException($"Service type could not be obtained for the service {serviceInterfaceType.Name}");
                }

                services.AddScoped(serviceInterfaceType, serviceType);
            }
        }
    }
}
