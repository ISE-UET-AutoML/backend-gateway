import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdirSync, statSync } from 'fs';

// Get current file path in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const getWhiteList = async () => {
  const servicesDir = join(__dirname, '../services');
  let whiteList = []
    
    try {
      // Read all service directories
      const serviceDirs = readdirSync(servicesDir)
        .filter(file => statSync(join(servicesDir, file)).isDirectory());

        // Load each service
        for (const serviceName of serviceDirs) {
          try {
            const servicePath = join(servicesDir, serviceName, 'config.js');
            const serviceModule = await import(servicePath);
            const currWhiteList = serviceModule.default.whiteList;
            whiteList = [...whiteList, ...currWhiteList]
          } catch (error) {
            continue
          }
        }
      } catch (error) {
        logger.error('Auth whitelist parsing error', {
          error: error.message,
        });
      } 
    return whiteList
}