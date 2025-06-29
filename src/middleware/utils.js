import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdirSync, statSync } from 'fs';
import config from '../config/index.js';
import dotenv from 'dotenv';
dotenv.config();

// Get current file path in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const getExcludeList = async () => {
  const servicesDir = join(__dirname, '../services');
  let excludeList = []

  try {
    // Read all service directories
    const serviceDirs = readdirSync(servicesDir)
      .filter(file => statSync(join(servicesDir, file)).isDirectory());

    // Load each service
    for (const serviceName of serviceDirs) {
      try {
        const servicePath = join(servicesDir, serviceName, 'config.js');
        const serviceModule = await import(servicePath);
        const serviceExcludeList = serviceModule.default.excludeList;
        excludeList = [...excludeList, ...serviceExcludeList.map(p => `/${serviceName}` + p)]
      } catch (error) {
        continue
      }
    }
    const availableServices = config.services
    Object.entries(availableServices).forEach(([name, options]) => {
      const serviceExcludeList = options.excludeList
      if (serviceExcludeList) {
        excludeList = [...excludeList, ...serviceExcludeList.map(p => `/service/${name}` + p)]
      }
    })
  } catch (error) {
    logger.error('Auth exclude list parsing error', {
      error: error.message,
    });
  }

  return excludeList

}