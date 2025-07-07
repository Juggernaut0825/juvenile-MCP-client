export class FastAPIMCPClient {
    constructor(baseUrl, apiKey = null) {
        this.baseUrl = baseUrl.replace(/\/+$/, ''); // Remove trailing slashes
        this.apiKey = apiKey;
        this.tools = [];
        this.connected = false;
    }

    async initialize() {
        console.log(`🔗 Connecting to FastAPI-MCP server at ${this.baseUrl}`);

        try {
            // Prepare headers for server requests
            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };

            // Add API key if available
            if (this.apiKey) {
                headers['X-API-Key'] = this.apiKey;
                headers['Authorization'] = `Bearer ${this.apiKey}`;
            }

            // Check if server is running
            const healthResponse = await fetch(`${this.baseUrl}/health`, { headers });
            if (!healthResponse.ok) {
                throw new Error(`Health check failed: ${healthResponse.status}`);
            }

            console.log(`✅ FastAPI-MCP server is healthy`);

            // Get available tools
            await this.discoverTools();
            this.connected = true;

            console.log(`📋 Discovered ${this.tools.length} tools`);
            return true;

        } catch (error) {
            console.error(`❌ Failed to connect to FastAPI-MCP server:`, error);
            return false;
        }
    }

    async discoverTools() {
        try {
            // Prepare headers for tools discovery
            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };

            // Add API key if available
            if (this.apiKey) {
                headers['X-API-Key'] = this.apiKey;
                headers['Authorization'] = `Bearer ${this.apiKey}`;
            }

            const toolsResponse = await fetch(`${this.baseUrl}/tools`, { headers });
            if (!toolsResponse.ok) {
                throw new Error(`Tools discovery failed: ${toolsResponse.status}`);
            }

            const toolsData = await toolsResponse.json();

            if (toolsData.tools && Array.isArray(toolsData.tools)) {
                this.tools = toolsData.tools.map(tool => ({
                    name: tool.name,
                    description: tool.description,
                    endpoint: tool.endpoint,
                    method: tool.method || 'GET',
                    parameters: tool.parameters || [],
                    // Convert to MCP format for compatibility
                    inputSchema: {
                        type: "object",
                        properties: this.convertParametersToSchema(tool.parameters || []),
                        required: (tool.parameters || []).filter(p => p.required).map(p => p.name)
                    }
                }));

                console.log(`🔧 Tools discovered:`, this.tools.map(t => t.name));
            } else {
                console.log(`⚠️ No tools found in response`);
                this.tools = [];
            }

        } catch (error) {
            console.error(`❌ Error discovering tools:`, error);
            this.tools = [];
        }
    }

    convertParametersToSchema(parameters) {
        const properties = {};
        parameters.forEach(param => {
            properties[param.name] = {
                type: param.type || "string",
                description: param.description || ""
            };
        });
        return properties;
    }

    async listTools() {
        if (!this.connected) {
            throw new Error("Not connected to FastAPI-MCP server");
        }

        return {
            tools: this.tools
        };
    }

    async callTool({ name, arguments: args }) {
        if (!this.connected) {
            throw new Error("Not connected to FastAPI-MCP server");
        }

        const tool = this.tools.find(t => t.name === name);
        if (!tool) {
            throw new Error(`Tool '${name}' not found`);
        }

        console.log(`🔧 Calling FastAPI-MCP tool: ${name}`);
        console.log(`📝 Arguments:`, args);

        try {
            let url = `${this.baseUrl}${tool.endpoint}`;

            // For GET requests, add parameters as query string
            if (tool.method === 'GET' && args) {
                const queryParams = new URLSearchParams();
                Object.entries(args).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        // If the value is an object, it must be stringified to be sent as a query param.
                        if (typeof value === 'object') {
                            queryParams.append(key, JSON.stringify(value));
                        } else {
                            queryParams.append(key, String(value));
                        }
                    }
                });

                if (queryParams.toString()) {
                    url += `?${queryParams.toString()}`;
                }
            }

            console.log(`🌐 Requesting: ${url}`);

            // Prepare headers
            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };

            // Add API key if available
            if (this.apiKey) {
                headers['X-API-Key'] = this.apiKey;
                headers['Authorization'] = `Bearer ${this.apiKey}`;
            }

            const response = await fetch(url, {
                method: tool.method,
                headers: headers,
                // For POST requests, send args in body
                body: tool.method === 'POST' ? JSON.stringify(args) : undefined
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Tool call failed: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const result = await response.json();
            console.log(`✅ Tool result:`, result);

            // Enhanced handling for cpolar/download URLs
            let contentText = JSON.stringify(result, null, 2);

            // If result contains download_url, format it nicely for the user
            if (result.download_url) {
                const downloadInfo = `

🌐 **Download URL**: ${result.download_url}
📁 **File**: ${result.file_info?.filename || 'Generated file'}
📊 **Status**: ${result.status}
💬 **Message**: ${result.message}

✅ **Ready for Public Access**: Your document is now available via the download URL above.
${result.download_url.includes('cpolar') ? '🚀 **Cpolar Tunnel Active**: File accessible from anywhere!' : '🏠 **Local Access**: File available on local network.'}`;

                contentText = downloadInfo;

                // Also log the download URL prominently
                console.log(`\n🌐 DOWNLOAD URL: ${result.download_url}`);
                console.log(`📁 FILE: ${result.file_info?.filename || 'Generated file'}`);
            }

            // Return in MCP format
            return {
                content: [
                    {
                        type: "text",
                        text: contentText
                    }
                ]
            };

        } catch (error) {
            console.error(`❌ Tool call failed:`, error);
            throw error;
        }
    }

    async close() {
        console.log(`❎ Disconnecting from FastAPI-MCP server`);
        this.connected = false;
        this.tools = [];
    }
} 