export class HttpClientTransport {
    constructor(url) {
        this.url = url;
        this.onMessage = null;
        this.onClose = null;
        this.onError = null;
    }

    async start() {
        console.log(`🔗 Starting HTTP MCP transport to ${this.url}`);
        // For HTTP transport, we don't need persistent connections
        // Just verify the server is reachable
        try {
            const testResponse = await fetch(this.url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    id: 1,
                    method: "initialize",
                    params: {
                        protocolVersion: "2024-11-05",
                        capabilities: {},
                        clientInfo: {
                            name: "http-mcp-client",
                            version: "1.0.0"
                        }
                    }
                })
            });

            if (testResponse.ok) {
                console.log(`✅ HTTP MCP server is responding`);
            }
        } catch (error) {
            console.log(`⚠️ Server test failed (this may be normal): ${error.message}`);
        }
    }

    async close() {
        console.log(`❎ Closing HTTP MCP transport`);
        if (this.onClose) {
            this.onClose();
        }
    }

    async send(message) {
        try {
            const response = await fetch(this.url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(message)
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`HTTP ${response.status}: ${text}`);
            }

            const result = await response.json();

            // For HTTP transport, we handle the response directly
            if (this.onMessage && result) {
                this.onMessage(result);
            }

            return result;
        } catch (error) {
            console.error(`❌ HTTP transport error:`, error);
            if (this.onError) {
                this.onError(error);
            }
            throw error;
        }
    }
} 