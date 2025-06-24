import config from '../../config/index.js';

const whiteList = ['/register', '/validate', "/login"]

export default {
    ...config,
    timeout: 5000,
    retries: 3,
    whiteList,
    endpoint: [
        ...whiteList,
        '/projects'
    ]
}; 