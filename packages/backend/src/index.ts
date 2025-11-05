import express, {Request, Response, NextFunction} from 'express';
import cors from 'cors';
import helmet from 'helmet';
import {config} from '@config/env.js';
import { testConnection } from './config/database.js';

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

/**
 * Body parsing middleware
 */
app.use(express.json({limit: '10mb'})); //parse JSON bodies
app.use(express.urlencoded({extended: true})); // Parse URL-encoded bodies

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
        await testConnection();
        app.listen(config.port, ()=>{
            console.log(`Password Manager API\nEnvironment: ${config.env.padEnd(24)}\nPort: ${config.port.toString().padEnd(32)}\nURL: http://localhost:${config.port.toString().padEnd(18)}`);
        })
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}

startServer();