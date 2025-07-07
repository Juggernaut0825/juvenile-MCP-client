export class GeminiLLM {
    constructor(apiKey, model = "google/gemini-pro-2.5") {
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

            // Only add tools if they exist and are valid
            if (tools && Array.isArray(tools) && tools.length > 0) {
                requestBody.tools = tools;
                requestBody.tool_choice = "auto";
                console.log(`🔧 Including ${tools.length} tool(s) in request`);
            } else {
                console.log(`💬 Sending chat-only request (no tools available)`);
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

            // Validate response structure
            if (!result.choices || !Array.isArray(result.choices) || result.choices.length === 0) {
                throw new Error("Invalid response format from OpenRouter API");
            }

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