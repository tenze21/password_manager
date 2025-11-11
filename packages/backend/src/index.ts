import express, {Request, Response, NextFunction} from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import {config} from '@config/env.js';
import { testConnection } from './config/database.js';
import { apiLimiter } from '@middleware/rateLimit.middleware.js';
import { verifyEmailConfig } from '@services/email.service.js';

// import routes
import authRoutes from '@routes/auth.routes.js';
import vaultRoutes from '@routes/vault.routes.js';
import twoFactorRoutes from '@routes/twoFactor.routes.js';

const app= express();

/**
 * Security middleware
 * helmet sets various HTTP headers for security
 */
app.use(helmet());

/**
 * CORS configuration
 * Allow requests from frontend origin
 */
app.use(cors({
    origin: config.cors.origin,
    credentials: true, //allow cookies
}));

// Cookie parser (for refresh tokens)
app.use(cookieParser());

/**
 * Body parsing middleware
 */
app.use(express.json({limit: '10mb'})); //parse JSON bodies
app.use(express.urlencoded({extended: true})); // Parse URL-encoded bodies

// Apply rate limiting to all routes
app.use(apiLimiter);

/**
 * Health check endpoint
 * Useful for monitoring and load balancers
 */
app.get('/health', (req: Request, res: Response)=>{
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        enviroment: config.env,
    });
});

/**
 * Root endpoint
 */
app.get('/', (req: Request, res: Response)=>{
    res.json({
        message: 'Password Manager API',
        version: '1.0.0',
        documentation: '/api/docs',
    });
});

// Mount auth routes
app.use('/api/auth', authRoutes);

// Mount valut routes
app.use('/api/vault', vaultRoutes);

app.use('/api/2fa', twoFactorRoutes);

/**
 * 404 handler
 * Catches all unmatched routes
 */

app.use((req:Request, res:Response)=>{
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: 'Route not found',
        }
    })
});

/**
 * Global error handler
 * Catches all errors thrown in the application
 */
app.use((err: Error, req: Request, res: Response, next: NextFunction)=>{
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        error:{
            code: 'INTERNAL_ERROR',
            message: config.env === 'development'? err.message : 'An internal error occured', ...(config.env === 'development' && {stack: err.stack}),
        }
    });
});

/**
 * Start server
 */
async function startServer(){
    try {
        // test database connection
        await testConnection();

        // verify email configuration (non-blocking)
        verifyEmailConfig();
        
        app.listen(config.port, ()=>{
            console.log(`Password Manager API\nEnvironment: ${config.env.padEnd(24)}\nPort: ${config.port.toString().padEnd(32)}\nURL: http://localhost:${config.port.toString().padEnd(18)}`);
        })
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}

startServer();