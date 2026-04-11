using System.Reflection;
using FluentValidation;
using SocialMedia.Data.Repository;
using SocialMedia.Data.Repository.Interfaces;
using SocialMedia.Database.Models;

namespace SocialMedia.Extensions
{
    public static class ServiceCollectionExtensions
    {
        /*public static IServiceCollection RegisterRepositories(this IServiceCollection services)
        {
            services.AddScoped(typeof(IRepository<,>), typeof(BaseRepository<,>));

            return services;
        } - open generic registration*/

        public static void RegisterRepositories(this IServiceCollection services, Assembly modelsAssembly)
        {
            Type[] typesToExclude = new Type[] { typeof(ApplicationUser), typeof(GroupMembership) };

            Type[] modelTypes = modelsAssembly
                .GetTypes()
                .Where(t => t.IsClass && !t.IsAbstract &&
                            !typesToExclude.Contains(t) &&
                            t.Namespace == "SocialMedia.Database.Models")
                .ToArray();

            foreach (Type type in modelTypes)
            {
                Type repositoryInterface = typeof(IRepository<,>);
                Type repositoryInstanceType = typeof(BaseRepository<,>);

                PropertyInfo? idPropInfo = type.GetProperties()
                    .FirstOrDefault(p =>
                        p.Name.Equals("Id", StringComparison.OrdinalIgnoreCase) ||
                        p.Name.Equals(type.Name + "Id", StringComparison.OrdinalIgnoreCase) // GroupMembershipId
                    );

                if (idPropInfo == null)
                {
                    throw new InvalidOperationException($"Entity {type.Name} not contain key.");
                }

                Type idType = idPropInfo.PropertyType;

                repositoryInterface = repositoryInterface.MakeGenericType(type, idType);
                repositoryInstanceType = repositoryInstanceType.MakeGenericType(type, idType);

                services.AddScoped(repositoryInterface, repositoryInstanceType);
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

        public static IServiceCollection RegisterValidatorsFromTypes(this IServiceCollection services, params Type[] markerTypes)
        {
            var assemblies = markerTypes.Select(t => t.Assembly).Distinct();

            foreach (var asm in assemblies)
            {
                var validatorTypes = asm.GetTypes()
                    .Where(t => !t.IsAbstract && !t.IsInterface)
                    .Where(t => t.GetInterfaces().Any(i =>
                        i.IsGenericType && i.GetGenericTypeDefinition() == typeof(IValidator<>)));

                foreach (var vt in validatorTypes)
                {
                    foreach (var intf in vt.GetInterfaces()
                        .Where(i => i.IsGenericType && i.GetGenericTypeDefinition() == typeof(IValidator<>)))
                    {
                        services.AddTransient(intf, vt);
                    }
                }
            }

            return services;
        }
    }
}