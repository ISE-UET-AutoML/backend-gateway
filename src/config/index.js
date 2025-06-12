import dotenv from 'dotenv';
dotenv.config();

const config = {
  // Server configuration
  port: parseInt(process.env.PORT || '3000', 10),
  env: process.env.NODE_ENV || 'development',

  // Security
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpiration: process.env.JWT_EXPIRATION || '1h',
  corsOrigin: process.env.CORS_ORIGIN || '*',

  // Redis configuration
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // Service URLs
  userServiceUrl: process.env.USER_SERVICE_URL || 'http://localhost:4001',
  dataServiceUrl: process.env.DATA_SERVICE_URL || 'http://localhost:4002',
  ml: process.env.ML_SERVICE_URL || 'http://ml-service:3002',
  monitor: process.env.MONITOR_SERVICE_URL || 'http://monitor-service:3004',
  chatBot: process.env.CHATBOT_SERVICE_URL || 'http://chatbot-service:3005',

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },

  // Monitoring
  monitoring: {
    metrics: {
      enabled: process.env.ENABLE_METRICS === 'true',
      port: process.env.METRICS_PORT || 9090,
    },
  },

  services: {
    user: {
      target: process.env.USER_SERVICE_URL || 'http://localhost:4001',
      pathRewrite: {
        '^/api/users': '/users'
      }
    },
    data: {
      target: process.env.DATA_SERVICE_URL || 'http://localhost:4002',
      pathRewrite: {
        '^/api/data': '/data'
      }
    },
  },
};

// Validate required configuration
const requiredEnvVars = ['JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

export default config; 