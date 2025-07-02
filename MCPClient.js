import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { HttpClientTransport } from "./HttpClientTransport.js";
import { FastAPIMCPClient } from "./FastAPIMCPClient.js";
import { GeminiLLM } from "./GeminiLLM.js";
import { config } from "./config.js";
import mcpServers from "./mcp-server-config.js";

export class MCPClient {
    constructor(openRouterApiKey = null) {
        this.openRouterApiKey = openRouterApiKey || config.openRouterApiKey;
        this.llm = new GeminiLLM(this.openRouterApiKey, config.geminiModel);
        this.clients = new Map();
        this.allTools = [];
        this.config = config;
    }

    async initialize() {
        console.log("🚀 Initializing MCP Client...");

        // Connect to all enabled MCP servers
        for (const serverConfig of mcpServers) {
            if (serverConfig.isOpen) {
                await this.connectToServer(serverConfig);
            }
        }

        console.log(`✅ Connected to ${this.clients.size} MCP server(s)`);
        console.log(`🔧 Available tools: ${this.allTools.length}`);
    }

    async connectToServer(serverConfig) {
        try {
            // Check if this is a FastAPI-MCP server
            const isFastAPIMCP = serverConfig.type === 'fastapi-mcp';

            let client;
            let toolsResult;

            if (isFastAPIMCP) {
                // Use FastAPI-MCP client for FastAPI-based servers
                console.log(`🔧 Using FastAPI-MCP client for ${serverConfig.name}`);
                client = new FastAPIMCPClient(serverConfig.url, serverConfig.apiKey);
                const connected = await client.initialize();

                if (connected) {
                    toolsResult = await client.listTools();
                } else {
                    throw new Error("Failed to initialize FastAPI-MCP client");
                }

            } else {
                // Use standard MCP client for JSON-RPC servers
                console.log(`🔧 Using standard MCP client for ${serverConfig.name}`);
                const transport = new HttpClientTransport(serverConfig.url);
                client = new Client({
                    name: "mcp-client",
                    version: "1.0.0"
                }, {
                    capabilities: {}
                });

                await client.connect(transport);
                toolsResult = await client.listTools();
            }

            this.clients.set(serverConfig.name, { client, config: serverConfig, type: isFastAPIMCP ? 'fastapi-mcp' : 'standard' });

            // List available tools from this server
            if (toolsResult.tools) {
                this.allTools.push(...toolsResult.tools.map(tool => ({
                    ...tool,
                    serverName: serverConfig.name
                })));
                console.log(`📋 Server ${serverConfig.name}: ${toolsResult.tools.length} tools`);
            }
        } catch (error) {
            console.error(`❌ Failed to connect to ${serverConfig.name}:`, error);
        }
    }

    async processUserQuery(userMessage) {
        console.log(`\n💬 Processing user query: "${userMessage}"`);

        const messages = [
            {
                role: "system",
                content: `You are an AI assistant with access to MCP (Model Context Protocol) tools for document generation.

Available tools:
${this.allTools.map(tool => `- ${tool.name}: ${tool.description}`).join('\n')}

IMPORTANT - Available Files and Paths:
- Template file: "${config.files.templatePath}" (Word template for historical building renovation reports)
- Sample data: "${config.files.sampleDataPath}" (contains renovation project data in Chinese)
- Output directory: "${config.files.outputDirectory}" (save all generated documents here)

When using the insert_template tool:
- Always use template_path: "${config.files.templatePath}"
- Use json_data_path: "${config.files.sampleDataPath}" for demo/testing
- Generate output_path in "${config.files.outputDirectory}" with descriptive names like "${config.files.outputDirectory}renovation_report_YYYY-MM-DD.docx"
- The tool generates historical building renovation documentation in Chinese

You should automatically use these file paths without asking the user. When the user asks for document generation, immediately use the available template and sample data to demonstrate the functionality.`
            },
            {
                role: "user",
                content: userMessage
            }
        ];

        return await this.chatLoop(messages);
    }

    async chatLoop(messages, maxIterations = 5) {
        let iteration = 0;

        while (iteration < maxIterations) {
            iteration++;
            console.log(`\n🔄 Chat iteration ${iteration}`);

            // Prepare tools for OpenRouter format
            const formattedTools = GeminiLLM.formatToolsForOpenRouter(this.allTools);

            // Send to LLM
            const response = await this.llm.sendToLLM(messages, formattedTools);

            if (!response.choices || response.choices.length === 0) {
                throw new Error("No response from LLM");
            }

            const choice = response.choices[0];
            const message = choice.message;

            // Add assistant message to conversation
            messages.push(message);

            // Check if LLM wants to use tools
            if (message.tool_calls && message.tool_calls.length > 0) {
                console.log(`🔧 LLM wants to use ${message.tool_calls.length} tool(s)`);

                // Execute each tool call
                for (const toolCall of message.tool_calls) {
                    const toolResult = await this.executeToolCall(toolCall);

                    // Add tool result to conversation
                    messages.push({
                        role: "tool",
                        tool_call_id: toolCall.id,
                        content: JSON.stringify(toolResult)
                    });
                }

                // Continue the loop to let LLM process tool results
                continue;
            }

            // No tool calls - return final response
            console.log(`✅ Final response received`);
            return {
                response: message.content,
                totalIterations: iteration,
                conversation: messages
            };
        }

        console.log(`⚠️ Reached maximum iterations (${maxIterations})`);
        return {
            response: "Maximum conversation iterations reached.",
            totalIterations: iteration,
            conversation: messages
        };
    }

    async executeToolCall(toolCall) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);

        console.log(`🔧 Executing tool: ${toolName}`);
        console.log(`📝 Arguments:`, toolArgs);

        // Find which server has this tool
        const tool = this.allTools.find(t => t.name === toolName);
        if (!tool) {
            const errorMsg = `Tool '${toolName}' not found`;
            console.error(`❌ ${errorMsg}`);
            return { error: errorMsg };
        }

        const serverInfo = this.clients.get(tool.serverName);
        if (!serverInfo) {
            const errorMsg = `Server '${tool.serverName}' not connected`;
            console.error(`❌ ${errorMsg}`);
            return { error: errorMsg };
        }

        try {
            // Call the tool via MCP (different methods for different client types)
            let result;

            if (serverInfo.type === 'fastapi-mcp') {
                // FastAPI-MCP client
                result = await serverInfo.client.callTool({
                    name: toolName,
                    arguments: toolArgs
                });
            } else {
                // Standard MCP client
                result = await serverInfo.client.callTool({
                    name: toolName,
                    arguments: toolArgs
                });
            }

            console.log(`✅ Tool result:`, result);
            return result;
        } catch (error) {
            console.error(`❌ Tool execution failed:`, error);
            return { error: error.message };
        }
    }

    async close() {
        console.log("🔄 Shutting down MCP Client...");

        for (const [serverName, serverInfo] of this.clients) {
            try {
                await serverInfo.client.close();
                console.log(`✅ Disconnected from ${serverName}`);
            } catch (error) {
                console.error(`❌ Error disconnecting from ${serverName}:`, error);
            }
        }

        this.clients.clear();
        this.allTools = [];
        console.log("👋 MCP Client shut down complete");
    }
} 