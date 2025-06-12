import 'dotenv/config';
import app from './app.js';
import logger from './utils/logger.js';
import config from './config/index.js';

const PORT = config.server.port;

const server = app.listen(PORT, () => {
  logger.info(`API Gateway is running on port ${PORT} in ${config.server.env} mode`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
}); 