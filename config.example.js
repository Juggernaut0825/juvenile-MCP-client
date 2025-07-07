// Example configuration file
// Copy this to config.js and update with your settings

export const config = {
    // OpenRouter API Key for Gemini 2.5 Pro
    // DO NOT set this here if you're using environment variables (.env file)
    // openRouterApiKey: "YOUR_OPENROUTER_API_KEY_HERE", // Commented out to use .env

    // Gemini model to use (default: google/gemini-2.5-pro)
    geminiModel: "google/gemini-2.5-pro",

    // Alternative models you can try:
    // "google/gemini-pro-vision" - for multimodal support
    // "google/gemini-flash-1.5" - for faster responses

    // Enable debug logging
    debug: false,

    // Maximum iterations for chat loop
    maxIterations: 5,

    // Request timeout in milliseconds
    timeout: 30000
}; 