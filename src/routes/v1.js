import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdirSync, statSync } from 'fs';
import logger from '../utils/logger.js';
import { createServiceProxy } from '../core/proxyFactory.js';
import { createServiceLimiter } from '../middleware/rateLimiter.js';
import { authMiddleware } from '../middleware/auth.js';
import config from '../config/index.js'

const router = express.Router();
// Get current file path in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const availableServices = Object.keys(config.services)

// Function to load service routes
const loadServiceRoutes = async () => {
  try {
      // Load each service
      for (const serviceName of availableServices) {
        try {
          router.use(`/api/service/${serviceName}`, authMiddleware, createServiceLimiter(), createServiceProxy(serviceName));
          logger.info(`Loaded service routes for: ${serviceName}`);
        } catch (error) {
          logger.error(`Failed to load service: ${serviceName}`, { error: error.message });
        }
      }

    // Health check endpoint
    router.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        services: serviceDirs,
        timestamp: new Date().toISOString()
      });
    });

  } catch (error) {
    logger.error('Failed to load services', { error: error.message });
    throw error;
  }
};

const loadCustomRoutes = async () => {
  const servicesDir = join(__dirname, '../services');
  
  try {
    // Read all service directories
    const serviceDirs = readdirSync(servicesDir).filter(file => statSync(join(servicesDir, file)).isDirectory());

    // Load each service
    for (const serviceName of serviceDirs) {
      try {
        const servicePath = join(servicesDir, serviceName, 'index.js');
        const serviceModule = await import(servicePath);
        const serviceRouter = serviceModule.default;
        
        // Mount service routes
        router.use(`/api/${serviceName}`, authMiddleware, createServiceLimiter(), serviceRouter);
        
        logger.info(`Loaded custom service routes for: ${serviceName}`);
      } catch (error) {
        logger.error(`Failed to load custom service: ${serviceName}`, { error: error.message });
      }
    }
  } catch (error) {
    logger.error('Failed to load custom services', { error: error.message });
  }
}

await loadServiceRoutes();
await loadCustomRoutes();
export default router;