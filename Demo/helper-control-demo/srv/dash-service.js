const { ApplicationService } = require('@sap/cds');

class DashService extends ApplicationService {
  async init() {
    const { OrchestrationClient } = await import('@sap-ai-sdk/orchestration');

    const orchestrationClient = new OrchestrationClient(
      {
        promptTemplating: {
          model: { name: 'gpt-4o', version: 'latest' }
        }
      },
      undefined,
      { destinationName: 'sapaicore' }
    );

    this.on('callLLM', async (req) => {
      const { prompt } = req.data;

      try {
        const response = await orchestrationClient.chatCompletion({
          messages: [{ role: 'user', content: prompt }]
        });

        return {
          response: response.getContent(),
          finishReason: response.getFinishReason(),
          tokenUsage: JSON.stringify(response.getTokenUsage())
        };
      } catch (e) {
        req.error(500, e.message);
      }
    });

    return super.init();
  }
}

module.exports = DashService;
