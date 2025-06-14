import { createProxyMiddleware } from 'http-proxy-middleware';
import logger from '../utils/logger.js';
import config from '../config/index.js';

class ProxyFactory {
  static createProxy(serviceConfig) {
    const {
      target,
      pathRewrite,
      timeout = 30000,
      retries = 3,
      onError
    } = serviceConfig;

    return createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite,
      timeout,
      proxyTimeout: timeout,
      retries,
      onProxyReq: (proxyReq, req, res) => {
        // Add correlation ID
        proxyReq.setHeader('x-correlation-id', req.correlationId || Date.now().toString());
        
        // Add user context if available
        if (req.user) {
          proxyReq.setHeader('x-user-id', req.user.id);
          proxyReq.setHeader('x-user-role', req.user.role);
        }

        // Log request
        logger.info('Proxying request', {
          method: req.method,
          path: req.path,
          target,
          correlationId: req.correlationId
        });
      },
      onProxyRes: (proxyRes, req, res) => {
        // Log response
        logger.info('Received response', {
          status: proxyRes.statusCode,
          path: req.path,
          correlationId: req.correlationId
        });
      },
      onError: (err, req, res) => {
        logger.error('Proxy error', {
          error: err.message,
          path: req.path,
          correlationId: req.correlationId
        });

        if (onError) {
          onError(err, req, res);
        } else {
          res.status(502).json({
            error: 'Bad Gateway',
            message: 'Service temporarily unavailable'
          });
        }
      }
    });
  }

  static createServiceProxy(serviceName) {
    const serviceConfig = config.services[serviceName];
    if (!serviceConfig) {
      throw new Error(`Service configuration not found for: ${serviceName}`);
    }

    return this.createProxy({
      target: serviceConfig.url,
      pathRewrite: {
        [`^/api/${serviceName}`]: ''
      },
      timeout: serviceConfig.timeout,
      retries: serviceConfig.retries
    });
  }
}

export default ProxyFactory; 