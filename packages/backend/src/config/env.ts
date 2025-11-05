import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename= fileURLToPath(import.meta.url);
const __dirname= path.dirname(__filename);

/**
 * Load environment variables based on NODE_ENV
 * 
 * In ES modules, we need to manually construct __dirname
 * because it's not available like in CommonJS
 */
const envFile= process.env.NODE_ENV === 'production'? '.env.production' : '.env.development';

/*
    “Hey dotenv, go two folders up from where this script is located, and load the 
    environment variables from the .env.development or .env.production file.”
*/
dotenv.config({path: path.resolve(__dirname, '../../', envFile)});

/**
 * Validates that required environment variables are present
 * Throws error if any are missing (fail fast principle)
 */
function validateEnv(): void{
    const required=['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET',];
    const missing= required.filter((varName)=>!process.env[varName]);

    if(missing.length > 0){
        throw new Error(`Missing required enviroment variables: ${missing.join(', ')}`);
    }
}

// Validate on startup
validateEnv();

/**
 * Type-safe environment configuration
 * 
 * Instead of accessing process.env directly everywhere,
 * we centralize it here with proper types
 */
export const config={
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3001', 10),

    database:{
        host: process.env.DB_HOST!,
        port: parseInt(process.env.DB_PORT!, 10),
        name: process.env.DB_NAME!,
        user: process.env.DB_USER!,
        password: process.env.DB_PASSWORD!,
    },
    jwt:{
        accessSecret: process.env.JWT_ACCESS_SECRET!,
        refreshSecret: process.env.JWT_REFRESH_SECRET!,
    },
    email: {
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587', 10),
        user: process.env.EMAIL_USER || '',
        password: process.env.EMAIL_PASSWORD || '',
        from: process.env.EMAIL_FROM || 'Password Manager <noreply@passwordmanager.local>',
    },
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    },
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    },
} as const;

/**
 * Type for the config object
 * Useful when passing config to functions
 */

export type Config= typeof config;

/*
    Here’s what’s happening:

    import.meta.url → gives a file URL, e.g.
    file:///home/user/project/src/config/index.js

    fileURLToPath() → converts that URL into a normal path string, e.g.
    /home/user/project/src/config/index.js

    path.dirname(__filename) → extracts the directory path, e.g.
    /home/user/project/src/config
*/