# MCP Client Usage Guide

## 🚀 Getting Started

### 1. First Run
```bash
npm start
```
This launches the interactive menu where you can:
- Check MCP server status
- View documentation
- Start interactive or demo mode

### 2. Quick Commands
```bash
npm run interactive  # Start chatting with AI
npm run demo        # See automated examples
npm run check       # Test server connectivity
```

## 💬 Interactive Mode

### Basic Commands
- `help` - Show available commands
- `tools` - List all available MCP tools
- `quit` or `exit` - Close the client

### Example Conversations

#### Documentation Generation
```
🗨️  You: I need to create API documentation for my REST service
🤖 AI: I'll help you generate comprehensive API documentation...
[Uses insert_template tool]
```

#### Code Analysis
```
🗨️  You: Can you analyze this code structure?
🤖 AI: I'll analyze the code for you...
[Uses analyze_code tool]
```

#### Multi-step Tasks
```
🗨️  You: Create a project template and then generate documentation
🤖 AI: I'll create a project template first, then generate documentation...
[Uses multiple tools in sequence]
```

## 🔧 Configuration

### Server Configuration (`mcp-server-config.js`)
```javascript
export default [
  {
    name: "my-server",
    type: "http",
    url: "http://localhost:8080/mcp",
    apiKey: "optional-api-key",
    isOpen: true
  }
];
```

### API Key Setup
1. **Environment Variable (Recommended)**:
   ```bash
   export OPENROUTER_API_KEY="sk-or-v1-your-key-here"
   ```

2. **Configuration File**:
   ```bash
   cp config.example.js config.js
   # Edit config.js with your settings
   ```

3. **Direct in Code**:
   Edit the API key in `index.js` or `interactive.js`

## 🛠️ Advanced Usage

### Custom Tool Integration
The client automatically discovers tools from your MCP servers. Tools are formatted for OpenRouter's function calling:

```javascript
{
  type: "function",
  function: {
    name: "tool_name",
    description: "Tool description",
    parameters: {
      type: "object",
      properties: { /* parameters */ }
    }
  }
}
```

### Error Handling
The client provides comprehensive error handling:
- Server connection failures
- API rate limits
- Tool execution errors
- Network timeouts

### Debugging
Enable detailed logging by checking console output:
- 🔗 Connection status
- 📋 Tool discovery
- 🔧 Tool execution
- 💬 LLM interactions

## 🌐 OpenRouter Integration

### Supported Models
- `google/gemini-pro-1.5` (default) - Best for general tasks
- `google/gemini-pro-vision` - Supports images and multimodal
- `google/gemini-flash-1.5` - Faster responses, lower cost

### Usage Patterns
1. **Simple Q&A**: Direct questions without tool usage
2. **Tool-Assisted**: AI determines when to use tools
3. **Multi-step**: Complex tasks using multiple tools
4. **Conversational**: Back-and-forth with context retention

## 📊 Best Practices

### Effective Prompting
- Be specific about what you want
- Mention if you want to use specific tools
- Provide context for better responses
- Ask follow-up questions for clarification

### Tool Usage
- Ensure MCP servers are running before starting
- Check tool availability with `tools` command
- Understand what each tool does
- Provide clear parameters when asked

### Performance Tips
- Use `google/gemini-flash-1.5` for faster responses
- Keep conversations focused to avoid context limits
- Restart if memory usage becomes high
- Monitor OpenRouter usage/billing

## 🐛 Troubleshooting

### Common Issues

#### "No tools available"
- Check if MCP servers are running
- Verify server URLs in configuration
- Test with `npm run check`

#### "API Key Invalid"
- Verify OpenRouter API key
- Check key permissions and billing
- Try different model if needed

#### "Connection Refused"
- Check server URLs and ports
- Verify firewall settings
- Test server endpoints manually

#### "Tool Execution Failed"
- Check tool parameters
- Verify server health
- Review server logs

### Getting Help
1. Check server status: `npm run check`
2. Review configuration files
3. Check console logs for errors
4. Test with simple queries first
5. Verify API key and billing status

## 🔄 Development

### Adding New Servers
1. Add server config to `mcp-server-config.js`
2. Set `isOpen: true`
3. Restart the client
4. Verify with `tools` command

### Extending Functionality
- Modify `GeminiLLM.js` for model changes
- Extend `HttpClientTransport.js` for authentication
- Add middleware in `MCPClient.js` for processing
- Update configuration for new features

### Testing Changes
```bash
npm run dev    # Auto-reload during development
npm test       # Run test scenarios
npm run check  # Verify server connectivity
``` 