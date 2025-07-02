import { FastAPIMCPClient } from "./FastAPIMCPClient.js";
import { config } from "./config.js";

async function demonstrateDocumentGeneration() {
    console.log("📄 Document Generation Demo");
    console.log("============================");

    const client = new FastAPIMCPClient("http://127.0.0.1:4242", config.openRouterApiKey);

    try {
        // Connect to the server
        const connected = await client.initialize();
        if (!connected) {
            console.log("❌ Failed to connect to MCP server. Is it running at http://127.0.0.1:4242?");
            return;
        }

        console.log("✅ Connected to FastAPI-MCP server");

        // Get the current date for output filename
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

        // Call the insert_template tool with your specified paths
        console.log("\n🔧 Calling insert_template tool...");
        console.log("Template: ./assets/template_test.doc");
        console.log("Data: ./assets/sample_input.json");
        console.log(`Output: ./outputs/renovation_report_${today}.docx`);

        const result = await client.callTool({
            name: "insert_template",
            arguments: {
                template_path: config.files.templatePath,
                json_data_path: config.files.sampleDataPath,
                output_path: `${config.files.outputDirectory}renovation_report_${today}.docx`
            }
        });

        console.log("\n📋 Tool Result:");
        console.log(result.content[0].text);

        console.log("\n✅ Document generation completed!");
        console.log("Check the ./outputs/ directory for your generated document.");

    } catch (error) {
        console.error("❌ Error:", error.message);
    } finally {
        await client.close();
    }
}

// Usage instructions
console.log(`
🚀 MCP Document Generation System

 This demonstrates how your AI assistant will automatically:
 1. Use template: ${config.files.templatePath}
 2. Use sample data: ${config.files.sampleDataPath}  
 3. Generate output: ${config.files.outputDirectory}renovation_report_YYYY-MM-DD.docx

When you chat with the AI using 'npm run interactive', it will
automatically use these file paths for document generation.

Running demo now...
`);

demonstrateDocumentGeneration(); 