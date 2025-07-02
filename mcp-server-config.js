import { config as dotenvConfig } from 'dotenv';
dotenvConfig();

export default [
    {
        name: "doc-generator-http",
        type: "fastapi-mcp",
        url: "http://127.0.0.1:4242",
        apiKey: process.env.OPENROUTER_API_KEY || "YOUR_OPENROUTER_API_KEY_HERE",
        isOpen: true
    },
    {
        name: "doc-gen-test",
        type: "fastapi-mcp",
        url: "https://509596fb.r12.cpolar.top",
        apiKey: process.env.OPENROUTER_API_KEY || "YOUR_OPENROUTER_API_KEY_HERE",
        isOpen: true // now enabled with your cpolar URL
    }
]; 