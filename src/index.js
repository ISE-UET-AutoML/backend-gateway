
import logger from './utils/logger.js';
import config from './config/index.js';
import app from './app.js'

// Start server
const PORT = config.port;
app.listen(PORT, () => {
    logger.info(`API Gateway listening on port ${PORT}`);
}); 

