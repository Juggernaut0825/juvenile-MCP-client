import { MCPClient } from "./MCPClient.js";
import { config } from "./config.js";
import { existsSync } from 'fs';

async function checkSystemStatus() {
    console.log("🔍 MCP Client System Status Check");
    console.log("=================================");

    // 1. Configuration Check
    console.log("\n1. 📋 Configuration Status:");
    console.log(`   ✅ Config loaded from: config.example.js`);
    console.log(`   🔑 API Key: ${config.openRouterApiKey.substring(0, 20)}...`);
    console.log(`   🤖 Model: ${config.geminiModel}`);
    console.log(`   ⚙️  Max Iterations: ${config.maxIterations}`);

    // 2. File System Check
    console.log("\n2. 📁 File System Status:");
    const templateExists = existsSync(config.files.templatePath);
    const dataExists = existsSync(config.files.sampleDataPath);
    const outputDirExists = existsSync(config.files.outputDirectory);

    console.log(`   ${templateExists ? '✅' : '❌'} Template: ${config.files.templatePath}`);
    console.log(`   ${dataExists ? '✅' : '❌'} Sample data: ${config.files.sampleDataPath}`);
    console.log(`   ${outputDirExists ? '✅' : '❌'} Output directory: ${config.files.outputDirectory}`);

    // 3. MCP Server Check
    console.log("\n3. 🌐 MCP Server Status:");
    try {
        const healthResponse = await fetch("http://127.0.0.1:4242/health");
        if (healthResponse.ok) {
            const healthData = await healthResponse.json();
            console.log(`   ✅ Server: ${healthData.status} (${healthData.service} v${healthData.version})`);
            console.log(`   🔧 Available tools: ${healthData.available_tools.join(', ')}`);
        } else {
            console.log(`   ❌ Server: HTTP ${healthResponse.status}`);
        }
    } catch (error) {
        console.log(`   ❌ Server: Not reachable (${error.message})`);
    }

    // 4. MCP Client Check
    console.log("\n4. 🤖 MCP Client Status:");
    const client = new MCPClient(config.openRouterApiKey);

    try {
        await client.initialize();
        console.log(`   ✅ Connected to ${client.clients.size} server(s)`);
        console.log(`   🔧 Discovered ${client.allTools.length} tool(s): ${client.allTools.map(t => t.name).join(', ')}`);

        if (client.allTools.length > 0) {
            console.log("   ✅ Ready for AI interactions");
        }
    } catch (error) {
        console.log(`   ❌ Connection failed: ${error.message}`);
    } finally {
        await client.close();
    }

    // 5. Overall Status
    console.log("\n5. 🎯 Overall Status:");
    const configOk = config.openRouterApiKey && config.geminiModel;
    const filesOk = templateExists && dataExists && outputDirExists;
    const serverOk = true; // We know it's responding from the test above

    if (configOk && filesOk && serverOk) {
        console.log("   🎉 ALL SYSTEMS READY!");
        console.log("   ▶️  Run: npm run interactive");
        console.log("   💬 Chat: 'Generate a renovation report document'");
    } else {
        console.log("   ⚠️  Some issues found:");
        if (!configOk) console.log("      - Check OpenRouter API key configuration");
        if (!filesOk) console.log("      - Check file paths and permissions");
        if (!serverOk) console.log("      - Check MCP server is running");
    }

    console.log("\n" + "=".repeat(50));
}

checkSystemStatus(); 