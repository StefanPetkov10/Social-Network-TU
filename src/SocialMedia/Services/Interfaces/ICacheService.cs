namespace SocialMedia.Services.Interfaces
{
    public interface ICacheService
    {
        Task<T?> GetAsync<T>(string key);
        Task SetAsync<T>(string key, T data, TimeSpan? absoluteExpireTime = null, TimeSpan? slidingExpireTime = null);
        Task RemoveAsync(string key);
        Task RemoveByPrefixAsync(string prefixKey);
    }
}
