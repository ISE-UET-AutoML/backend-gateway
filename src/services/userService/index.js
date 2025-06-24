import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import config from '../../config/index.js';
import { authMiddleware } from '../../middleware/auth.js';
import { createServiceLimiter } from '../../middleware/rateLimiter.js';

const router = express.Router();

// Public routes (no auth)
router.use('/register');

router.use('/validate');

// Protected routes (require auth)
router.use('/', authMiddleware);

export default router;
