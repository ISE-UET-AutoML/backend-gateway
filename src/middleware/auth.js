import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../utils/errors.js';
import logger from '../utils/logger.js';
import config from '../config/index.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdirSync, statSync } from 'fs';

// Get current file path in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let whiteList = null

const getWhiteList = async () => {
  const servicesDir = join(__dirname, '../services');
  let whiteList = []
    
    try {
      // Read all service directories
      const serviceDirs = readdirSync(servicesDir)
        .filter(file => statSync(join(servicesDir, file)).isDirectory());

        // Load each service
        for (const serviceName of serviceDirs) {
          try {
            const servicePath = join(servicesDir, serviceName, 'config.js');
            const serviceModule = await import(servicePath);
            const currWhiteList = serviceModule.default.whiteList;
            whiteList = [...whiteList, ...currWhiteList]
          } catch (error) {
            continue
          }
        }
      } catch (error) {
        logger.error('Auth whitelist parsing error', {
          error: error.message,
        });
      } 
    return whiteList
      
}

export const authMiddleware = async (req, res, next) => {
  try {
    if (whiteList === null) {
      whiteList = await getWhiteList()
    }
    const token = req.headers.authorization?.split(' ')[1];
    if (whiteList.includes(req.path.replace("/api", ""))) {
      return next()
    }
    
    if (!token) {
      throw new UnauthorizedError('No token provided');
    }

    const decoded = jwt.verify(token, config.accessTokenSecret);
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

export const generateJwtToken = (user, jwtSecret, TTL) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
    },
    jwtSecret,
    { expiresIn: TTL }
  );
};