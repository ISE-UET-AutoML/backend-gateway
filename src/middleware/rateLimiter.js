import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';
import logger from '../utils/logger.js';
import config from '../config/index.js';

// Create Redis client
const redis = new Redis(config.redisUrl);

// Create Redis store with ioredis client
const createRedisStore = (prefix) => {
    return new RedisStore({
        sendCommand: (...args) => redis.call(...args),
        prefix: `rate-limit:${prefix}:`
    });
};

// Global rate limiter
const globalLimiter = rateLimit({
    store: createRedisStore('global'),
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: {
        error: 'Too many requests, please try again later.'
    },
    handler: (req, res) => {
        logger.warn('Global rate limit exceeded', {
            ip: req.ip,
            path: req.path,
            correlationId: req.correlationId
        });
        res.status(429).json({
            error: 'Too many requests',
            message: 'Please try again later.'
        });
    }
});

// User-specific rate limiter
const userLimiter = rateLimit({
    store: createRedisStore('user'),
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    keyGenerator: (req) => req.user?.id || req.ip,
    message: {
        error: 'Too many requests, please try again later.'
    },
    handler: (req, res) => {
        logger.warn('User rate limit exceeded', {
            userId: req.user?.id,
            ip: req.ip,
            path: req.path,
            correlationId: req.correlationId
        });
        res.status(429).json({
            error: 'Too many requests',
            message: 'Please try again later.'
        });
    }
});

// Service-specific rate limiter
export const createServiceLimiter = (options = {}) => {
    return rateLimit({
        store: createRedisStore(options.service || 'service'),
        windowMs: options.windowMs || config.rateLimit.windowMs,
        max: options.max || config.rateLimit.max,
        keyGenerator: options.keyGenerator || ((req) => req.user?.id || req.ip),
        message: {
            error: 'Too many requests, please try again later.'
        },
        handler: (req, res) => {
            logger.warn('Service rate limit exceeded', {
                service: options.service,
                userId: req.user?.id,
                ip: req.ip,
                path: req.path,
                correlationId: req.correlationId
            });
            res.status(429).json({
                error: 'Too many requests',
                message: 'Please try again later.'
            });
        }
    });
};

// Error handling for Redis connection
redis.on('error', (error) => {
  logger.error('Redis connection error:', error);
});

export { globalLimiter, userLimiter }; 