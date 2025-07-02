import { MCPClient } from "./MCPClient.js";
import { config } from "./config.js";

async function main() {
    const client = new MCPClient(config.openRouterApiKey); // Explicitly pass API key

    try {
        // Initialize the client and connect to MCP servers
        await client.initialize();

        // Example queries to test the system
        const testQueries = [
            "What tools are available?",
            "Help me generate a documentation template",
            "Can you show me how to use the available tools?"
        ];

        console.log("\n" + "=".repeat(60));
        console.log("🎯 MCP Client with Gemini 2.5 Pro Ready!");
        console.log("=".repeat(60));

        // Process each test query
        for (const query of testQueries) {
            try {
                console.log("\n" + "-".repeat(40));
                const result = await client.processUserQuery(query);

                console.log(`\n💡 Response:`);
                console.log(result.response);
                console.log(`\n📊 Completed in ${result.totalIterations} iteration(s)`);

            } catch (error) {
                console.error(`❌ Error processing query "${query}":`, error);
            }
        }

    } catch (error) {
        console.error("❌ Fatal error:", error);
    } finally {
        // Clean shutdown
        await client.close();
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n⚠️ Received SIGINT, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n⚠️ Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});

// Run the main function
main().catch(console.error); 