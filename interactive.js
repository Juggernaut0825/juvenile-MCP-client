import { MCPClient } from "./MCPClient.js";
import { config } from "./config.js";
import { createInterface } from 'readline';

// Create readline interface for user input
const rl = createInterface({
    input: process.stdin,
    output: process.stdout
});

let client = null;

async function initializeClient() {
    try {
        console.log(`[DEBUG interactive.js] API Key from config: ${config.openRouterApiKey ? `***${config.openRouterApiKey.slice(-6)}` : 'MISSING'}`);
        client = new MCPClient(config.openRouterApiKey);
        await client.initialize();

        console.log("\n" + "=".repeat(60));
        console.log("🎯 Interactive MCP Client with Gemini 2.5 Pro Ready!");
        console.log("=".repeat(60));

        if (client.allTools.length > 0) {
            console.log("\n🔧 Available Tools:");
            client.allTools.forEach(tool => {
                console.log(`  • ${tool.name}: ${tool.description}`);
            });
        } else {
            console.log("\n⚠️ No tools available. Make sure your MCP servers are running.");
        }

        console.log("\n💡 Type your questions or commands. Type 'quit' to exit.\n");

        return true;
    } catch (error) {
        console.error("❌ Failed to initialize MCP Client:", error);
        return false;
    }
}

async function handleUserInput(input) {
    const query = input.trim();

    if (query.toLowerCase() === 'quit' || query.toLowerCase() === 'exit') {
        console.log("\n👋 Goodbye!");
        await cleanup();
        process.exit(0);
    }

    if (query.toLowerCase() === 'help') {
        showHelp();
        return;
    }

    if (query.toLowerCase() === 'tools') {
        showTools();
        return;
    }

    if (!query) {
        console.log("💬 Please enter a question or command.");
        return;
    }

    try {
        console.log(`\n🤖 Processing: "${query}"`);
        console.log("-".repeat(50));

        const result = await client.processUserQuery(query);

        console.log(`\n💡 Response:`);
        console.log(result.response);
        console.log(`\n📊 Completed in ${result.totalIterations} iteration(s)`);

    } catch (error) {
        console.error(`❌ Error processing query:`, error.message);
    }
}

function showHelp() {
    console.log(`
📚 Available Commands:
  • help     - Show this help message
  • tools    - List available tools
  • quit     - Exit the application
  
💬 Example Queries:
  • "What tools are available?"
  • "Generate a documentation template"
  • "Help me with [specific task]"
  
🔧 Your MCP servers provide tools that I can use to help you.
   Just ask naturally and I'll use the appropriate tools!
`);
}

function showTools() {
    if (client.allTools.length === 0) {
        console.log("⚠️ No tools currently available.");
        return;
    }

    console.log(`\n🔧 Available Tools (${client.allTools.length}):`);
    client.allTools.forEach((tool, index) => {
        console.log(`\n${index + 1}. ${tool.name}`);
        console.log(`   Server: ${tool.serverName}`);
        console.log(`   Description: ${tool.description}`);
        if (tool.inputSchema && tool.inputSchema.properties) {
            const params = Object.keys(tool.inputSchema.properties);
            if (params.length > 0) {
                console.log(`   Parameters: ${params.join(', ')}`);
            }
        }
    });
}

async function cleanup() {
    if (client) {
        await client.close();
    }
    rl.close();
}

async function promptUser() {
    rl.question('🗨️  You: ', async (input) => {
        await handleUserInput(input);
        console.log(); // Add spacing
        promptUser(); // Continue the conversation loop
    });
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n\n⚠️ Received interrupt signal, shutting down gracefully...');
    await cleanup();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n\n⚠️ Received termination signal, shutting down gracefully...');
    await cleanup();
    process.exit(0);
});

// Main execution
async function main() {
    const initialized = await initializeClient();

    if (initialized) {
        promptUser();
    } else {
        console.log("❌ Exiting due to initialization failure.");
        process.exit(1);
    }
}

main().catch(async (error) => {
    console.error("❌ Fatal error:", error);
    await cleanup();
    process.exit(1);
}); 