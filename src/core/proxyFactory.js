import { createProxyMiddleware } from 'http-proxy-middleware';
import logger from '../utils/logger.js';
import config from '../config/index.js';
import { getWhiteList } from '../middleware/utils.js';
const excludeList = await getWhiteList()

const pathFilter = function (pathname, req) {
  const path = pathname.replace("/api/users", '');
  return !excludeList.includes(path);
};

const createProxy = (serviceConfig) => {
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
    pathFilter: pathFilter,
    timeout,
    proxyTimeout: timeout,
    retries,
    headers: {
      'Connection': 'keep-alive',
      'Keep-Alive': 'timeout=5, max=1000'
    },

    onProxyReq: (proxyReq, req, res) => {
      proxyReq.setHeader('Accept', 'application/json');
      proxyReq.setHeader('User-Agent', 'API-Gateway/1.0');
      // Add correlation ID
      proxyReq.setHeader('x-correlation-id', req.correlationId || Date.now().toString());
      
      // Add user context if available
      if (req.user) {
        proxyReq.setHeader('x-user-id', req.user.id);
        // proxyReq.setHeader('x-user-role', req.user.role); // Tạm thời ẩn role
      }


      if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
        if (req.body && Object.keys(req.body).length > 0) {
          const bodyData = JSON.stringify(req.body);
          proxyReq.setHeader('Content-Type', 'application/json');
          proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
          proxyReq.write(bodyData);
        } else {
          // Empty body for POST requests
          proxyReq.setHeader('Content-Length', '0');
        }
      }
      
      // Log request
      logger.info('Proxying request', {
        method: req.method,
        path: req.path,
        target,
        correlationId: req.correlationId,
        userId: req.user?.id
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
};

const createServiceProxy = (serviceName) => {
  const serviceConfig = config.services[serviceName];
  if (!serviceConfig) {
    throw new Error(`Service configuration not found for: ${serviceName}`);
  }
  
  return createProxy({
    target: serviceConfig.target,
    pathRewrite: serviceConfig.pathRewrite,
    timeout: serviceConfig.timeout,
    retries: serviceConfig.retries,
    
  });
};

export { createServiceProxy };