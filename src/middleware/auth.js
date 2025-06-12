import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../utils/errors.js';
import logger from '../utils/logger.js';
import config from '../config/index.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      throw new UnauthorizedError('No token provided');
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    
    // Add correlation ID for request tracking
    req.correlationId = req.headers['x-correlation-id'] || Date.now().toString();
    
    next();
  } catch (error) {
    logger.error('Authentication error', {
      error: error.message,
      path: req.path,
      correlationId: req.correlationId
    });

    if (error instanceof UnauthorizedError) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: error.message
      });
    }

    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token'
    });
  }
};

export const roleMiddleware = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No user found in request'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions'
      });
    }

    next();
  };
}; 