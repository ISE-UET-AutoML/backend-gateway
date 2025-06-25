import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServiceProxy } from './core/proxyFactory.js';
import { authMiddleware } from './middleware/auth.js';
import { createServiceLimiter } from './middleware/rateLimiter.js';
import config from './config/index.js';
import logger from './utils/logger.js';
import router from './routes/v1.js';
// Load environment variables
dotenv.config();

const app = express();
// Middleware
app.use(helmet());
app.use(cors());

// Parse JSON and urlencoded bodies BEFORE mounting router
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// Request logging
app.use((req, res, next) => {
    req.correlationId = req.headers['x-correlation-id'] || Date.now().toString();
    logger.info('Incoming request', {
        method: req.method,
        path: req.path,
        correlationId: req.correlationId
    });
    next();
});

app.use(router)


// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'api-gateway' });
});

// 404 handler
app.use((req, res) => {
    logger.warn('Route not found', {
        method: req.method,
        path: req.path,
        correlationId: req.correlationId
    });
    res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource does not exist'
    });
});

// Error handler
app.use((err, req, res, next) => {
    logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        correlationId: req.correlationId
    });

    if (res.headersSent) {
        return next(err);
    }

    // res.status(500).json({
    //     error: 'Internal Server Error',
    //     message: 'An unexpected error occurred'
    // });
});

export default app;