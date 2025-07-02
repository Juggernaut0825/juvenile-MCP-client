export class GeminiLLM {
    constructor(apiKey, model = "google/gemini-pro-1.5") {
        this.apiKey = apiKey;
        this.model = model;
        this.baseUrl = "https://openrouter.ai/api/v1/chat/completions";
    }

    async sendToLLM(messages, tools = null) {
        try {
            console.log(`🤖 Sending request to Gemini ${this.model}...`);

            const requestBody = {
                model: this.model,
                messages,
                temperature: 0.7,
                max_tokens: 4000
            };

            // Add tools if provided
            if (tools && tools.length > 0) {
                requestBody.tools = tools;
                requestBody.tool_choice = "auto";
            }

            const response = await fetch(this.baseUrl, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.apiKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:3000", // Optional referer
                    "X-Title": "MCP Client" // Optional title
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`OpenRouter API error ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            console.log(`✅ Received response from Gemini`);

            return result;
        } catch (error) {
            console.error(`❌ LLM request failed:`, error);
            throw error;
        }
    }

    // Helper method to create tool schema compatible with OpenRouter
    static formatToolsForOpenRouter(mcpTools) {
        return mcpTools.map(tool => ({
            type: "function",
            function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.inputSchema || {
                    type: "object",
                    properties: {},
                    required: []
                }
            }
        }));
    }
} 