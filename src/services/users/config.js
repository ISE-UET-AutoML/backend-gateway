import config from '../../config/index.js';

export default {
    ...config,
    timeout: 5000,
    retries: 3,
    excludeList: config.services.users.excludeList,
}; 