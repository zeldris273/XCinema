using StackExchange.Redis;
using System.Text.Json;

namespace Movie_BE.Services
{
    public interface IRedisCacheService
    {
        Task<T?> GetAsync<T>(string key);
        Task<string?> GetStringAsync(string key);
        Task SetAsync<T>(string key, T value, TimeSpan? expiry = null);
        Task SetStringAsync(string key, string value, TimeSpan? expiry = null);
        Task<bool> DeleteAsync(string key);
        Task<bool> ExistsAsync(string key);
        Task<long> IncrementAsync(string key, long value = 1);
        Task<long> DecrementAsync(string key, long value = 1);
        Task<bool> HashSetAsync(string key, string field, string value);
        Task<string?> HashGetAsync(string key, string field);
        Task<Dictionary<string, string>> HashGetAllAsync(string key);
        Task<bool> HashDeleteAsync(string key, string field);
        Task ExpireAsync(string key, TimeSpan expiry);
    }

    public class RedisCacheService : IRedisCacheService
    {
        private readonly IConnectionMultiplexer _redis;
        private readonly IDatabase _db;
        private readonly ILogger<RedisCacheService> _logger;
        private readonly TimeSpan _defaultExpiry;

        public RedisCacheService(
            IConnectionMultiplexer redis,
            IConfiguration configuration,
            ILogger<RedisCacheService> logger)
        {
            _redis = redis;
            _db = redis.GetDatabase();
            _logger = logger;
            
            var cacheDuration = configuration.GetValue<int>("Redis:DefaultCacheDuration", 900);
            _defaultExpiry = TimeSpan.FromSeconds(cacheDuration);
        }

        public async Task<T?> GetAsync<T>(string key)
        {
            try
            {
                var value = await _db.StringGetAsync(key);
                if (value.IsNullOrEmpty)
                    return default;

                return JsonSerializer.Deserialize<T>(value!);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting cache key: {Key}", key);
                return default;
            }
        }

        public async Task<string?> GetStringAsync(string key)
        {
            try
            {
                var value = await _db.StringGetAsync(key);
                return value.IsNullOrEmpty ? null : value.ToString();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting string cache key: {Key}", key);
                return null;
            }
        }

        public async Task SetAsync<T>(string key, T value, TimeSpan? expiry = null)
        {
            try
            {
                var json = JsonSerializer.Serialize(value);
                await _db.StringSetAsync(key, json, expiry ?? _defaultExpiry);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting cache key: {Key}", key);
            }
        }

        public async Task SetStringAsync(string key, string value, TimeSpan? expiry = null)
        {
            try
            {
                await _db.StringSetAsync(key, value, expiry ?? _defaultExpiry);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting string cache key: {Key}", key);
            }
        }

        public async Task<bool> DeleteAsync(string key)
        {
            try
            {
                return await _db.KeyDeleteAsync(key);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting cache key: {Key}", key);
                return false;
            }
        }

        public async Task<bool> ExistsAsync(string key)
        {
            try
            {
                return await _db.KeyExistsAsync(key);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking if cache key exists: {Key}", key);
                return false;
            }
        }

        public async Task<long> IncrementAsync(string key, long value = 1)
        {
            try
            {
                return await _db.StringIncrementAsync(key, value);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error incrementing cache key: {Key}", key);
                return 0;
            }
        }

        public async Task<long> DecrementAsync(string key, long value = 1)
        {
            try
            {
                return await _db.StringDecrementAsync(key, value);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error decrementing cache key: {Key}", key);
                return 0;
            }
        }

        public async Task<bool> HashSetAsync(string key, string field, string value)
        {
            try
            {
                return await _db.HashSetAsync(key, field, value);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting hash field: {Key}.{Field}", key, field);
                return false;
            }
        }

        public async Task<string?> HashGetAsync(string key, string field)
        {
            try
            {
                var value = await _db.HashGetAsync(key, field);
                return value.IsNullOrEmpty ? null : value.ToString();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting hash field: {Key}.{Field}", key, field);
                return null;
            }
        }

        public async Task<Dictionary<string, string>> HashGetAllAsync(string key)
        {
            try
            {
                var entries = await _db.HashGetAllAsync(key);
                return entries.ToDictionary(
                    x => x.Name.ToString(),
                    x => x.Value.ToString()
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all hash fields: {Key}", key);
                return new Dictionary<string, string>();
            }
        }

        public async Task<bool> HashDeleteAsync(string key, string field)
        {
            try
            {
                return await _db.HashDeleteAsync(key, field);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting hash field: {Key}.{Field}", key, field);
                return false;
            }
        }

        public async Task ExpireAsync(string key, TimeSpan expiry)
        {
            try
            {
                await _db.KeyExpireAsync(key, expiry);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting expiry for key: {Key}", key);
            }
        }
    }
}
