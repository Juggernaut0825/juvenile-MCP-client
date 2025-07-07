# 🎯 MCP Client with Intelligent Gemini 2.5 Pro

**An intelligent MCP (Model Context Protocol) client that works just like Cursor** - natural conversations with smart tool usage when needed.

## ✨ Key Features

🧠 **Intelligent Conversations** - Chat naturally without forced tool calling  
🔧 **Smart Tool Usage** - AI decides when tools are needed, not hardcoded behavior  
🌐 **Multiple MCP Servers** - Connect to any MCP-compatible server  
🎨 **Beautiful Web Interface** - Cursor-inspired UI with real-time tool management  
⚡ **Dynamic Server Toggle** - Enable/disable servers on the fly  
📱 **Multiple Interfaces** - Web UI, interactive CLI, or programmatic usage

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up your OpenRouter API key
export OPENROUTER_API_KEY="sk-or-v1-your-key-here"

# Start the web interface (recommended)
npm run web
# Open http://localhost:3000

# Or use interactive CLI
npm run interactive
```

## 💬 How It Works (Like Cursor!)

### ✅ Natural Conversations
```
User: "Hello"
AI: "Hello! How can I help you today?" 
    ↳ Natural greeting, no tools called

User: "How are you?"
AI: "I'm doing well! I'm here to help with various tasks..."
    ↳ Conversational response, appropriate behavior
```

### ✅ Intelligent Tool Usage  
```
User: "Generate a renovation report"
AI: "I'll create a renovation report for you..."
    ↳ Calls insert_template tool → Creates document

User: "What tools are available?"
AI: "I have access to these tools: [lists available tools]"
    ↳ Explains capabilities without calling tools
```

### ❌ Old Hardcoded Behavior (Fixed!)
```
❌ Before: "Hello" → "I'll generate a document..." → insert_template
✅ Now: "Hello" → "Hello! How can I help you today?"

❌ Before: "What's 2+2?" → Document generation attempt  
✅ Now: "What's 2+2?" → "2+2 equals 4."
```

## 🔧 Adding New MCP Tools

The system automatically discovers tools from connected servers. See **[HOW-TO-ADD-MCP-TOOLS.md](./HOW-TO-ADD-MCP-TOOLS.md)** for complete guide.

### Quick Method: Add New Server

1. **Edit `mcp-server-config.json`:**
```json
[
  {
    "name": "my-new-server",
    "type": "fastapi-mcp", 
    "url": "http://localhost:8000",
    "isOpen": true
  }
]
```

2. **Start your MCP server** with tools at `/tools` endpoint

3. **Restart the client** - tools are automatically discovered!

### Supported Server Types
- `"fastapi-mcp"` - FastAPI-based MCP servers  
- `"http"` - Standard JSON-RPC MCP servers

## 🎨 Web Interface Features

**Cursor-Inspired Design:**
- 🌙 Dark theme with modern UI
- 🔧 **Server toggle switches** (just like Cursor!)
- 💬 **Real-time chat** with tool execution
- 📊 **Live status indicators** 
- 🌐 **Auto-download detection** for generated files

## 📦 Installation

1. **Install Dependencies**:
```bash
npm install
```

2. **Configure Your Servers**: Edit `mcp-server-config.js` with your MCP server details:
```javascript
export default [
  {
    name: "doc-generator-http",
    type: "http",
    url: "http://127.0.0.1:4242/mcp",
    apiKey: "your-openrouter-api-key",
    isOpen: true
  }
];
```

3. **Set API Key**: 
   - Option 1: Update the API key directly in `index.js`
   - Option 2: Use environment variable: `export OPENROUTER_API_KEY="your-key"`
   - Option 3: Copy `config.example.js` to `config.js` and update settings

## 🏃‍♂️ Quick Start

```bash
# 🌐 Web Interface (recommended for visual experience)
npm run web

# 🚀 Terminal Interface
npm start           # Launch the main menu
npm run interactive # Interactive chat mode  

# 🔧 Testing & Status
npm run status      # Check system status
npm run test-docs   # Test document generation
npm run demo        # Run automated demo
npm run dev         # Development mode with auto-reload

# 🌐 Cpolar tunneling support
npm run cpolar-test # Test cpolar connectivity
npm run cpolar-help # Show cpolar setup guide
```

## 🔧 Architecture

### Core Components

1. **MCPClient**: Main orchestrator class
2. **HttpClientTransport**: HTTP transport implementation for MCP protocol
3. **GeminiLLM**: OpenRouter Gemini API wrapper
4. **Configuration**: Server configuration management

### Flow Diagram

```
User Query → Gemini LLM → Function Calls → MCP Tools → Results → Gemini → Response
```

## 🛠️ Usage Examples

### Basic Query Processing
```javascript
import { MCPClient } from "./MCPClient.js";

const client = new MCPClient("your-openrouter-api-key");
await client.initialize();

const result = await client.processUserQuery("Generate a documentation template");
console.log(result.response);
```

### Custom Tool Integration
```javascript
// The client automatically discovers tools from connected MCP servers
// Tools are formatted for OpenRouter's function calling format
const tools = client.allTools;
console.log("Available tools:", tools.map(t => t.name));
```

## 🌐 OpenRouter Configuration

### Supported Gemini Models
- `google/gemini-pro-1.5` - Text only (default)
- `google/gemini-pro-vision` - Multimodal support

### API Configuration
The client sends requests to `https://openrouter.ai/api/v1/chat/completions` with proper headers:
- Authorization with your API key
- Content-Type: application/json
- Optional HTTP-Referer and X-Title headers

## 📋 Configuration Options

### Server Configuration (`mcp-server-config.js`)
```javascript
{
  name: "server-name",        // Unique identifier
  type: "http",              // Transport type
  url: "http://example.com/mcp", // MCP endpoint
  apiKey: "your-key",        // Optional API key
  isOpen: true               // Enable/disable server
}
```

### LLM Configuration
```javascript
const llm = new GeminiLLM(apiKey, "google/gemini-pro-1.5");
```

## 🔍 Debugging

Enable detailed logging by checking console output:
- 🔗 Connection status
- 📋 Tool discovery
- 🔧 Tool execution
- 💬 LLM interactions
- ✅ Results and errors

## 🚨 Error Handling

The client includes comprehensive error handling:
- HTTP transport errors
- LLM API failures
- Tool execution errors
- Server connection issues
- Graceful shutdown on SIGINT/SIGTERM

## 🌐 Web Interface

**New!** Beautiful visual interface that mimics Cursor's MCP tools interface:

```bash
npm run web
# Open http://localhost:3000 in your browser
```

**Features:**
- 🎨 **Cursor-inspired Design**: Dark theme with modern UI elements
- 🔧 **Visual Tool Management**: Toggle switches for servers (just like Cursor!)
- 💬 **Interactive Chat**: Chat with AI and see tool execution in real-time
- 📊 **Status Indicators**: Real-time connection and tool status
- 🌐 **Download Integration**: Automatic detection of generated document URLs

See **[WEB-INTERFACE.md](./WEB-INTERFACE.md)** for complete documentation.

## 🌐 Cpolar Tunneling Setup

For public access to generated files, see **[CPOLAR-SETUP.md](./CPOLAR-SETUP.md)** for complete setup instructions.

Quick start:
1. Start your FastAPI server with cpolar support
2. Run `npm run cpolar-test` to test connectivity  
3. Use `npm run cpolar-help` for detailed setup instructions
4. Generated documents will include public download URLs

## 🔄 Development

### Adding New Servers
1. Add server configuration to `mcp-server-config.js`
2. Set `isOpen: true`
3. Restart the client

### Extending Functionality
- Modify `GeminiLLM.js` for different model configurations
- Extend `HttpClientTransport.js` for custom authentication
- Add middleware in `MCPClient.js` for request/response processing

## 📝 Example Output

### Document Generation Demo
```bash
# Direct tool usage
node example-usage.js
```

### Launcher Menu
```
============================================================
🎯 MCP Client with Gemini 2.5 Pro Launcher
============================================================

📋 Choose an option:

1. 🚀 Start Interactive Mode (recommended)
2. 🧪 Run Demo Queries
3. 🔍 Check MCP Server Status
4. 📚 Show Documentation
5. ❌ Exit

💡 Make sure your MCP servers are running before starting!
```

### Interactive Mode with Document Generation
```
🚀 Initializing MCP Client...
🔧 Using FastAPI-MCP client for doc-generator-http
🔗 Connecting to FastAPI-MCP server at http://127.0.0.1:4242
✅ FastAPI-MCP server is healthy
📋 Server doc-generator-http: 1 tools
✅ Connected to 1 MCP server(s)
🔧 Available tools: 1

============================================================
🎯 Interactive MCP Client with Gemini 2.5 Pro Ready!
============================================================

🔧 Available Tools:
  • insert_template: Fills a DOCX template with JSON data using AI-powered logic

💡 Type your questions or commands. Type 'quit' to exit.

🗨️  You: Generate a renovation report document

🤖 Processing: "Generate a renovation report document"
--------------------------------------------------
🤖 Sending request to Gemini google/gemini-pro-1.5...
🔧 LLM wants to use 1 tool(s)
🔧 Executing tool: insert_template
🔧 Calling FastAPI-MCP tool: insert_template
📝 Arguments: {
  "template_path": "./assets/template_test.doc",
  "json_data_path": "./assets/sample_input.json", 
  "output_path": "./outputs/renovation_report_2025-01-25.docx"
}
✅ Tool result: { "status": "success", "message": "Document generated successfully." }
✅ Final response received

💡 Response:
I've successfully generated a renovation report document using the historical building template and sample data. The document has been saved to ./outputs/renovation_report_2025-01-25.docx and contains the renovation project details for the traditional Qing Dynasty courtyard building project.
```

### File Structure
```
mcp-client/
├── assets/
│   ├── template_test.doc      # Word template for renovation reports
│   └── sample_input.json      # Sample renovation project data
├── outputs/                   # Generated documents save here
│   └── renovation_report_*.docx
└── ...
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details. 