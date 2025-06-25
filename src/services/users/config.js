import config from '../../config/index.js';

const excludeList = ['/register', '/validate', "/login"]

export default {
    ...config,
    timeout: 5000,
    retries: 3,
    excludeList,
    endpoints: [
        ...excludeList,
        '/projects'
    ]
}; 