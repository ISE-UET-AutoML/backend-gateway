import axios from 'axios';
import logger from './logger.js';
import config from '../config/index.js';

// Create axios instance with default config
const axiosInstance = axios.create({
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Add correlation ID
    config.headers['x-correlation-id'] = config.headers['x-correlation-id'] || Date.now().toString();
    
    // Log request
    logger.info('Making request', {
      method: config.method,
      url: config.url,
      correlationId: config.headers['x-correlation-id']
    });
    
    return config;
  },
  (error) => {
    logger.error('Request error', {
      error: error.message,
      url: error.config?.url
    });
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    // Log response
    logger.info('Received response', {
      status: response.status,
      url: response.config.url,
      correlationId: response.config.headers['x-correlation-id']
    });
    
    return response;
  },
  (error) => {
    // Log error
    logger.error('Response error', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      correlationId: error.config?.headers['x-correlation-id']
    });

    // Handle specific error cases
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      return Promise.reject({
        status: error.response.status,
        data: error.response.data,
        message: error.response.data?.message || 'Service error'
      });
    } else if (error.request) {
      // The request was made but no response was received
      return Promise.reject({
        status: 503,
        message: 'Service unavailable'
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      return Promise.reject({
        status: 500,
        message: 'Internal error'
      });
    }
  }
);

export default axiosInstance; 