import config from '../../config/index.js';

export default {
    url: config.dataServiceUrl,
    timeout: 5000,
    retries: 3,
    endpoints: {
        datasets: '/datasets',
        transform: '/transform',
        validate: '/validate'
    }
}; 