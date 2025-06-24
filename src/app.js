import express from 'express';
import cors from 'cors';
import config from './config/index.js';
import { createServiceProxy } from './core/proxyFactory.js';
import { authMiddleware } from './middleware/auth.js';
import { createServiceLimiter } from './middleware/rateLimiter.js';
import logger from './utils/logger.js';

const app = express();

// Basic middleware
app.use(cors({
    origin: config.corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

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

// Body parsers - MUST come before proxy routes for POST requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Public user service routes (no authentication required)
app.use('/api/users/register', createServiceLimiter(), createServiceProxy('user', {
    pathRewrite: {
        '^/api/users/register': '/users/register'
    }
}));

app.use('/api/users/validate', createServiceLimiter(), createServiceProxy('user', {
    pathRewrite: {
        '^/api/users/validate': '/users/validate'
    }
}));

// Protected user service routes (authentication required)
app.use('/api/users', authMiddleware, createServiceLimiter(), createServiceProxy('user', {
    pathRewrite: {
        '^/api/users': '/users'
    }
}));

// Data service routes (authentication required)
app.use('/api/data', authMiddleware, createServiceLimiter(), createServiceProxy('data'));

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

    res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred'
    });
});

export default app; 