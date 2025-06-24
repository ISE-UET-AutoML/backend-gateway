import axios from 'axios';
import logger from '../../utils/logger.js';
import config from './config.js';
import userService from '../userService/userService.js';

class DataService {
    constructor() {
        this.axios = axios.create({
            baseURL: config.url,
            timeout: config.timeout
        });
    }

    async createDataset(data, userId, correlationId) {
        try {
            // 1. Validate user permissions
            const userPermissions = await userService.checkUserPermissions(userId, correlationId);
            if (!userPermissions.canCreateDataset) {
                throw new Error('User does not have permission to create datasets');
            }

            // 2. Create dataset
            const response = await this.axios.post(config.endpoints.datasets, {
                ...data,
                createdBy: userId
            }, {
                headers: { 'x-correlation-id': correlationId }
            });

            // 3. Update user's dataset list
            await userService.updateUserDatasets(userId, response.data.id, correlationId);

            return {
                ...response.data,
                permissions: userPermissions
            };
        } catch (error) {
            logger.error('Error creating dataset', {
                error: error.message,
                userId,
                correlationId
            });
            throw error;
        }
    }

    async getDataset(datasetId, userId, correlationId) {
        try {
            // 1. Validate user access
            const [datasetResponse, userAccess] = await Promise.all([
                this.axios.get(`${config.endpoints.datasets}/${datasetId}`, {
                    headers: { 'x-correlation-id': correlationId }
                }),
                userService.getUserDatasetAccess(userId, datasetId, correlationId)
            ]);

            return {
                ...datasetResponse.data,
                access: userAccess
            };
        } catch (error) {
            logger.error('Error getting dataset', {
                error: error.message,
                datasetId,
                userId,
                correlationId
            });
            throw error;
        }
    }

    async transformData(data, format, correlationId) {
        try {
            const response = await this.axios.post(config.endpoints.transform, {
                data,
                format
            }, {
                headers: { 'x-correlation-id': correlationId }
            });

            return response.data;
        } catch (error) {
            logger.error('Error transforming data', {
                error: error.message,
                format,
                correlationId
            });
            throw error;
        }
    }

    async validateData(data, schema, correlationId) {
        try {
            const response = await this.axios.post(config.endpoints.validate, {
                data,
                schema
            }, {
                headers: { 'x-correlation-id': correlationId }
            });

            return response.data;
        } catch (error) {
            logger.error('Error validating data', {
                error: error.message,
                correlationId
            });
            throw error;
        }
    }
}

export default new DataService(); 