import axios from 'axios';
import logger from '../../utils/logger.js';
import config from '../../config/index.js';

class UserService {
    constructor() {
        this.axios = axios.create({
            baseURL: config.userServiceUrl,
            timeout: 5000
        });
    }

    async checkUserPermissions(userId, correlationId) {
        try {
            const response = await this.axios.get(`/users/${userId}/permissions`, {
                headers: { 'x-correlation-id': correlationId }
            });
            return response.data;
        } catch (error) {
            logger.error('Error checking user permissions', {
                error: error.message,
                userId,
                correlationId
            });
            throw error;
        }
    }

    async updateUserDatasets(userId, datasetId, correlationId) {
        try {
            await this.axios.post(`/users/${userId}/datasets`, {
                datasetId
            }, {
                headers: { 'x-correlation-id': correlationId }
            });
        } catch (error) {
            logger.error('Error updating user datasets', {
                error: error.message,
                userId,
                datasetId,
                correlationId
            });
            throw error;
        }
    }

    async getUserDatasetAccess(userId, datasetId, correlationId) {
        try {
            const response = await this.axios.get(`/users/${userId}/datasets/${datasetId}`, {
                headers: { 'x-correlation-id': correlationId }
            });
            return response.data;
        } catch (error) {
            logger.error('Error getting user dataset access', {
                error: error.message,
                userId,
                datasetId,
                correlationId
            });
            throw error;
        }
    }

    async validateUserAccess(userId, datasetId, correlationId) {
        try {
            const [permissions, access] = await Promise.all([
                this.checkUserPermissions(userId, correlationId),
                this.getUserDatasetAccess(userId, datasetId, correlationId)
            ]);

            return {
                hasAccess: access.hasAccess,
                permissions: permissions.permissions
            };
        } catch (error) {
            logger.error('Error validating user access', {
                error: error.message,
                userId,
                datasetId,
                correlationId
            });
            throw error;
        }
    }
}

export default new UserService(); 