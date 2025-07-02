#!/usr/bin/env node
import { createInterface } from 'readline';

// Configuration
import { config as dotenvConfig } from 'dotenv';
dotenvConfig();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
    console.error("❌ ERROR: OPENROUTER_API_KEY is required!");
    console.error("   Please set it in your .env file or as an environment variable.");
    console.error("   Copy .env.example to .env and add your API key.");
    process.exit(1);
}

async function checkMCPServers() {
    console.log("🔍 Checking MCP server availability...\n");

    const servers = [
        { name: "doc-generator-http", url: "http://127.0.0.1:4242/mcp" },
        // Add more servers from your config here
    ];

    const results = [];

    for (const server of servers) {
        try {
            console.log(`🔗 Testing ${server.name} at ${server.url}...`);

            const response = await fetch(server.url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    id: 1,
                    method: "ping"
                })
            });

            if (response.ok || response.status === 405) {
                console.log(`✅ ${server.name}: Server is responding`);
                results.push({ ...server, status: "available" });
            } else {
                console.log(`⚠️ ${server.name}: Server returned ${response.status}`);
                results.push({ ...server, status: "error", error: `HTTP ${response.status}` });
            }
        } catch (error) {
            console.log(`❌ ${server.name}: ${error.message}`);
            results.push({ ...server, status: "unavailable", error: error.message });
        }
    }

    return results;
}

async function showMenu() {
    console.log("\n" + "=".repeat(60));
    console.log("🎯 MCP Client with Gemini 2.5 Pro Launcher");
    console.log("=".repeat(60));

    console.log(`
📋 Choose an option:

1. 🚀 Start Interactive Mode (recommended)
2. 🧪 Run Demo Queries
3. 🔍 Check MCP Server Status
4. 📚 Show Documentation
5. ❌ Exit

💡 Make sure your MCP servers are running before starting!
`);

    const rl = createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question('Choose option (1-5): ', (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

async function runDemo() {
    const { main } = await import('./index.js');
    await main();
}

async function runInteractive() {
    console.log("Starting interactive mode...");
    process.exit(0); // Exit and let user run npm run interactive
}

function showDocumentation() {
    console.log(`
📚 MCP Client Documentation

🏗️ Architecture:
   User Query → Gemini LLM → Function Calls → MCP Tools → Results → Response

🔧 Required Setup:
   1. MCP Server running (e.g., http://127.0.0.1:4242/mcp)
   2. OpenRouter API Key for Gemini 2.5 Pro
   3. Valid server configuration in mcp-server-config.js

📝 Example MCP Server Command:
   # If you have a Python MCP server:
   python your_mcp_server.py --port 4242
   
   # If you have a Node.js MCP server:
   node your_mcp_server.js --port 4242

🌐 OpenRouter Models:
   • google/gemini-pro-1.5 (default) - Text only
   • google/gemini-pro-vision - Multimodal support
   • google/gemini-flash-1.5 - Faster responses

📋 Configuration Files:
   • mcp-server-config.js - MCP server endpoints
   • config.example.js - API keys and settings template

🐛 Troubleshooting:
   • Check if MCP servers are running with option 3
   • Verify API key is valid for OpenRouter
   • Ensure server URLs are accessible
   • Check firewall/network settings

🚀 Quick Commands:
   • npm run interactive  - Start interactive mode
   • npm run demo        - Run automated demo
   • npm run check       - Check server status
`);
}

async function main() {
    while (true) {
        try {
            const choice = await showMenu();

            switch (choice) {
                case '1':
                    console.log("\n🚀 Run: npm run interactive");
                    console.log("👋 Goodbye!");
                    process.exit(0);
                    break;

                case '2':
                    console.log("\n🧪 Running Demo Queries...\n");
                    await runDemo();
                    break;

                case '3':
                    await checkMCPServers();
                    break;

                case '4':
                    showDocumentation();
                    break;

                case '5':
                    console.log("\n👋 Goodbye!");
                    process.exit(0);
                    break;

                default:
                    console.log("\n❌ Invalid option. Please choose 1-5.");
                    break;
            }

            // Wait for user to press enter before showing menu again
            if (choice !== '1' && choice !== '2') {
                const rl = createInterface({
                    input: process.stdin,
                    output: process.stdout
                });

                await new Promise(resolve => {
                    rl.question('\nPress Enter to continue...', () => {
                        rl.close();
                        resolve();
                    });
                });
            }

        } catch (error) {
            console.error("\n❌ Error:", error.message);

            const rl = createInterface({
                input: process.stdin,
                output: process.stdout
            });

            await new Promise(resolve => {
                rl.question('\nPress Enter to continue...', () => {
                    rl.close();
                    resolve();
                });
            });
        }
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n👋 Goodbye!');
    process.exit(0);
});

main().catch(console.error); 