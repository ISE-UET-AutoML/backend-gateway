import { createProxyMiddleware } from 'http-proxy-middleware';
import logger from '../utils/logger.js';
import config from '../config/index.js';
import { getExcludeList } from '../middleware/utils.js';
const excludeList = await getExcludeList()
const createPathFilter = (serviceName, excludeList) => {
  return function pathFilter(pathname, req) {
    const basePath = `/api/service`;
    const trimmedPath = pathname.replace(basePath, '');
    return !excludeList.includes(trimmedPath);
  };
};


const createProxy = (serviceConfig) => {
  const {
    target,
    serviceName,
    excludeList,
    pathRewrite,
    timeout = 30000,
    retries = 3,
    onError
  } = serviceConfig;

  const pathFilter = createPathFilter(serviceName, excludeList)

  return createProxyMiddleware(pathFilter, {
    target,
    changeOrigin: true,
    pathRewrite,
    timeout,
    proxyTimeout: timeout,
    retries,
    

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


      if (req.body && Object.keys(req.body).length > 0) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      } else {
        // Empty body for POST requests
        proxyReq.setHeader('Content-Length', '0');
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
    serviceName: serviceName,
    excludeList: excludeList.filter(item => item.startsWith(`/${serviceName}`)),
    pathRewrite: serviceConfig.pathRewrite,
    timeout: serviceConfig.timeout,
    retries: serviceConfig.retries,
    
  });
};

export { createServiceProxy };