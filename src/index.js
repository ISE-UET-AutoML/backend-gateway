import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { authMiddleware } from './middleware/auth.js';
import { createServiceLimiter } from './middleware/rateLimiter.js';
import logger from './utils/logger.js';
import config from './config/index.js';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
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

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'api-gateway' });
});

// User service routes
app.use('/api/users', authMiddleware, createServiceLimiter(), createProxyMiddleware({
    ...config.services.user,
    changeOrigin: true,
    onError: (err, req, res) => {
        logger.error('User service proxy error', {
            error: err.message,
            path: req.path,
            correlationId: req.correlationId
        });
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Error connecting to user service'
        });
    }
}));

// Data service routes
app.use('/api/data', authMiddleware, createServiceLimiter(), createProxyMiddleware({
    ...config.services.data,
    changeOrigin: true,
    onError: (err, req, res) => {
        logger.error('Data service proxy error', {
            error: err.message,
            path: req.path,
            correlationId: req.correlationId
        });
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Error connecting to data service'
        });
    }
}));

// Error handling
app.use((err, req, res, next) => {
    logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
        correlationId: req.correlationId
    });

    res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred'
    });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
    logger.info(`API Gateway listening on port ${PORT}`);
}); 