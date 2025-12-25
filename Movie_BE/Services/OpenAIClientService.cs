using OpenAI_API;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Movie_BE.Services
{
    public interface IOpenAIClientService
    {
        OpenAIAPI GetClient();
    }

    public class OpenAIClientService : IOpenAIClientService
    {
        private readonly OpenAIAPI _client;
        private readonly ILogger<OpenAIClientService> _logger;

        public OpenAIClientService(IConfiguration configuration, ILogger<OpenAIClientService> logger)
        {
            _logger = logger;
            var openAiKey = configuration["OpenAI:ApiKey"];
            
            if (string.IsNullOrEmpty(openAiKey))
            {
                _logger.LogError("OpenAI API key is missing in configuration.");
                throw new InvalidOperationException("OpenAI API key is not configured.");
            }

            _client = new OpenAIAPI(openAiKey);
            _logger.LogInformation("OpenAI client initialized successfully.");
        }

        public OpenAIAPI GetClient()
        {
            return _client;
        }
    }
}
