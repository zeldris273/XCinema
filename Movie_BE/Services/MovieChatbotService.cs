using OpenAI_API.Chat;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Movie_BE.Models;
using System.Security.Cryptography;
using System.Text;

namespace Movie_BE.Services
{
    public interface IMovieChatbotService
    {
        Task<string> GetMoviesByDescriptionAsync(string description, string userId);
        Task<int> GetRemainingQueriesAsync(string userId);
    }

    public class ImprovedMovieChatbotService : IMovieChatbotService
    {
        private readonly IOpenAIClientService _openAIClient;
        private readonly IRedisCacheService _cacheService;
        private readonly ILogger<ImprovedMovieChatbotService> _logger;
        private const int CACHE_EXPIRATION_HOURS = 24;
        private const string CACHE_PREFIX = "chatbot:";

        public ImprovedMovieChatbotService(
            IOpenAIClientService openAIClient,
            IRedisCacheService cacheService,
            ILogger<ImprovedMovieChatbotService> logger)
        {
            _openAIClient = openAIClient;
            _cacheService = cacheService;
            _logger = logger;
        }

        public async Task<string> GetMoviesByDescriptionAsync(string description, string userId)
        {
            try
            {
                var (isAllowed, remaining) = await CheckRateLimitAsync(userId);
                if (!isAllowed)
                {
                    _logger.LogWarning("Rate limit exceeded for user: {UserId}", userId);
                    return JsonSerializer.Serialize(new
                    {
                        Error = "You have reached your daily limit of 5 questions. Please try again tomorrow.",
                        RemainingQueries = 0
                    });
                }

                var cacheKey = GenerateCacheKey(description);
                var cachedResult = await _cacheService.GetStringAsync(cacheKey);

                if (!string.IsNullOrEmpty(cachedResult))
                {
                    _logger.LogInformation("Cache hit for description: {Description}", description);
                    return cachedResult;
                }

                var openAi = _openAIClient.GetClient();

                var prompt = BuildOptimizedPrompt(description);

                var chatRequest = new ChatRequest
                {
                    Model = "gpt-3.5-turbo",
                    Messages = new[]
                    {
                        new ChatMessage(ChatMessageRole.System, GetSystemPrompt()),
                        new ChatMessage(ChatMessageRole.User, prompt)
                    },
                    MaxTokens = 500,
                    Temperature = 0.3
                };

                _logger.LogInformation("Sending request to OpenAI for user: {UserId}", userId);
                var result = await openAi.Chat.CreateChatCompletionAsync(chatRequest);
                var searchCriteriaJson = result.Choices[0].Message.Content.Trim();

                if (string.IsNullOrWhiteSpace(searchCriteriaJson))
                {
                    _logger.LogError("OpenAI returned empty response for description: {Description}", description);
                    return JsonSerializer.Serialize(new { Error = "Unable to process your request. Please try again." });
                }

                searchCriteriaJson = CleanJsonResponse(searchCriteriaJson);

                _logger.LogInformation("Received OpenAI response: {Json}", searchCriteriaJson);

                JsonElement jsonElement;
                try
                {
                    jsonElement = JsonSerializer.Deserialize<JsonElement>(searchCriteriaJson);
                }
                catch (JsonException ex)
                {
                    _logger.LogError(ex, "Failed to parse OpenAI response as JSON: {Json}", searchCriteriaJson);
                    return JsonSerializer.Serialize(new { Error = "Invalid response format from AI. Please try rephrasing your question." });
                }

                if (jsonElement.TryGetProperty("Error", out var errorElement))
                {
                    return JsonSerializer.Serialize(new { Error = errorElement.GetString() });
                }

                try
                {
                    var searchCriteria = JsonSerializer.Deserialize<MovieSearchCriteria>(searchCriteriaJson);
                    if (searchCriteria == null || searchCriteria.MovieTitles == null || searchCriteria.MovieTitles.Length == 0)
                    {
                        _logger.LogWarning("Invalid search criteria structure: {Json}", searchCriteriaJson);
                        return JsonSerializer.Serialize(new { Error = "No movies found matching your description." });
                    }
                }
                catch (JsonException ex)
                {
                    _logger.LogError(ex, "Failed to validate MovieSearchCriteria: {Json}", searchCriteriaJson);
                    return JsonSerializer.Serialize(new { Error = "Unable to process movie suggestions." });
                }

                await _cacheService.SetStringAsync(cacheKey, searchCriteriaJson, TimeSpan.FromHours(CACHE_EXPIRATION_HOURS));
                _logger.LogInformation("Cached response for key: {CacheKey}", cacheKey);

                var responseDict = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(searchCriteriaJson);
                var finalResponse = new Dictionary<string, object>();

                foreach (var kvp in responseDict)
                {
                    finalResponse[kvp.Key] = kvp.Value;
                }
                finalResponse["RemainingQueries"] = remaining - 1;
                return JsonSerializer.Serialize(finalResponse);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing movie search for description: {Description}", description);
                return JsonSerializer.Serialize(new { Error = "An error occurred while processing your request. Please try again." });
            }
        }

        private async Task<(bool isAllowed, int remaining)> CheckRateLimitAsync(string userId)
        {
            const int MAX_REQUESTS = 5;
            const int TIME_WINDOW_HOURS = 24;

            var rateLimitKey = $"ratelimit:chatbot:{userId}";
            var currentCount = await _cacheService.GetAsync<int?>(rateLimitKey);

            var count = currentCount ?? 0;

            if (count >= MAX_REQUESTS)
            {
                return (false, 0);
            }

            var newCount = count + 1;
            await _cacheService.SetAsync(rateLimitKey, newCount, TimeSpan.FromHours(TIME_WINDOW_HOURS));

            return (true, MAX_REQUESTS - count);
        }

        public async Task<int> GetRemainingQueriesAsync(string userId)
        {
            const int MAX_REQUESTS = 5;
            var rateLimitKey = $"ratelimit:chatbot:{userId}";
            var currentCount = await _cacheService.GetAsync<int?>(rateLimitKey);

            var count = currentCount ?? 0;
            return Math.Max(0, MAX_REQUESTS - count);
        }

        private string GenerateCacheKey(string description)
        {
            var normalized = description.Trim().ToLowerInvariant();
            using var sha256 = SHA256.Create();
            var hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(normalized));
            var hash = BitConverter.ToString(hashBytes).Replace("-", "").ToLower();
            return $"{CACHE_PREFIX}{hash}";
        }

        private string GetSystemPrompt()
        {
            return @"You are a movie recommendation assistant. When users describe movies or TV series they want to watch, you suggest 1-3 specific titles that match their description.

Rules:
1. Suggest SPECIFIC movie or TV series titles, not generic descriptions
2. Titles must be real, well-known movies or TV series
3. If the question is not about movies/TV series, return {""Error"": ""Please ask about movies or TV series""}
4. Return ONLY valid JSON format with double quotes
5. Be diverse in your suggestions (different genres/years if applicable)

JSON format:
{
  ""MovieTitles"": [""Title 1"", ""Title 2"", ""Title 3""],
  ""Genre"": ""comma-separated genres"",
  ""Year"": ""year or year range"",
  ""Actors"": ""notable actors"",
  ""Themes"": ""main themes/plot summary"",
  ""Keywords"": ""search keywords""
}";
        }

        private string BuildOptimizedPrompt(string description)
        {
            return $"Find movies/TV series matching this description: '{description}'\n\nProvide 1-3 specific titles.";
        }

        private string CleanJsonResponse(string json)
        {
            // Remove markdown code blocks if present
            json = json.Trim();
            if (json.StartsWith("```json"))
            {
                json = json.Substring(7);
            }
            else if (json.StartsWith("```"))
            {
                json = json.Substring(3);
            }

            if (json.EndsWith("```"))
            {
                json = json.Substring(0, json.Length - 3);
            }

            return json.Trim();
        }
    }
}
