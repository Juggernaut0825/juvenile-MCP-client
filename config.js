// Configuration loader with multiple sources
// Priority: config.js > environment variables > defaults

import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { config as dotenvConfig } from 'dotenv';

// Load environment variables from .env file
dotenvConfig();

// Get the directory of this config file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = __dirname;

let userConfig = {};
try {
    // Try to load user config file if it exists
    const configModule = await import('./config.example.js');
    userConfig = configModule.config || {};
    console.log("✅ Loaded configuration from config.example.js");
} catch (error) {
    console.log("📋 No user config file found, using environment variables and defaults");
}

// Validate required environment variables
if (!process.env.OPENROUTER_API_KEY && !userConfig.openRouterApiKey) {
    console.error("❌ ERROR: OPENROUTER_API_KEY is required!");
    console.error("   Please set it in your .env file or as an environment variable.");
    console.error("   Copy .env.example to .env and add your API key.");
    process.exit(1);
}

export const config = {
    // OpenRouter API Key for Gemini 2.5 Pro (REQUIRED)
    openRouterApiKey:
        userConfig.openRouterApiKey ||
        process.env.OPENROUTER_API_KEY ||
        "YOUR_OPENROUTER_API_KEY",

    // Gemini model to use
    geminiModel:
        userConfig.geminiModel ||
        process.env.GEMINI_MODEL ||
        "google/gemini-2.5-pro",

    // Debug logging
    debug:
        userConfig.debug ||
        (process.env.DEBUG === 'true') ||
        false,

    // Maximum iterations for chat loop
    maxIterations:
        userConfig.maxIterations ||
        parseInt(process.env.MAX_ITERATIONS) ||
        5,

    // Request timeout in milliseconds
    timeout:
        userConfig.timeout ||
        parseInt(process.env.TIMEOUT) ||
        30000,

    // File paths for document generation (absolute paths for cross-directory compatibility)
    files: {
        templatePath: resolve(projectRoot, "assets", "template_test.doc"),
        sampleDataPath: resolve(projectRoot, "assets", "sample_input.json"),
        outputDirectory: resolve(projectRoot, "outputs") + "/"
    },

    // MinIO Configuration
    minio: {
        endPoint: '43.139.19.144',
        port: 9000,
        useSSL: false,
        accessKey: 'minioadmin',
        secretKey: 'minioadmin',
        bucket: 'mcp-files'
    }
};

// Log current configuration (without showing full API key)
if (config.debug) {
    console.log("🔧 Configuration loaded:");
    console.log(`   API Key: ${config.openRouterApiKey.substring(0, 20)}...`);
    console.log(`   Model: ${config.geminiModel}`);
    console.log(`   Debug: ${config.debug}`);
    console.log(`   Max Iterations: ${config.maxIterations}`);
    console.log(`   Timeout: ${config.timeout}ms`);
} 