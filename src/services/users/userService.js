import axios from 'axios';
import logger from '../../utils/logger.js';
import config from './config.js';
import dotenv from 'dotenv';
import { generateJwtToken } from '../../middleware/auth.js';
dotenv.config()
class UserService {
    constructor() {
        const serviceName = "/users"
        this.axios = axios.create({
            baseURL: config.userServiceUrl + serviceName,
            timeout: 5000
        });
    }

    async loginUser(email, password) {
        try {
            const response = await this.axios.post('/login', { email, password });
            return response.data;
        } catch (error) {
            logger.error('Error while logging in user', {
                error: error.message,
                email
            });
            throw error.response?.data?.error || error;
        }
    }

    async saveRefreshToken(userId, refreshToken, expiresAt) {
        try {
            await this.axios.post('/saveRefreshToken', {
                userId,
                refreshToken,
                expiresAt
            });
        } catch (error) {
            logger.error('Error saving refresh token', {
                error: error.message,
                userId
            });
            throw error.response?.data?.error || error;
        }
    }

    async handleLogin(email, password) {
        // 1. Xác thực user
        const user = await this.loginUser(email, password);


        // 2. Tạo JWT token
        const accessToken = generateJwtToken(user, config.accessTokenSecret, '1d');

        // 3. Tạo refreshToken và lưu vào user service
        const refreshToken = generateJwtToken(user, config.refreshTokenSecret, '30d');
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 ngày
        await this.saveRefreshToken(user.id, refreshToken, expiresAt);
        // 4. Trả JWT và refreshToken về client
        return {
            accessToken, // sửa lại key đúng chuẩn
            refreshToken,
            user
        };
    }

    async register(userData) {
        try {
            const response = await this.axios.post(`/register`, userData)
            return response.data
        } catch (error) {
            logger.error('Error while registering user', {
                error: error.message,
                response: error.response?.data,
            })
            throw error
        }
    }

    async getUserProjects(headers) {
        const userId = headers['x-user-id']
        try {
            const response = await this.axios.get(`/projects`, {
                headers: {
                    "x-user-id": userId
                }

            })
            return response.data
        } catch (error) {
            logger.error('Error getting user projects', {
                userId,
                error: error.message,
                response: error.response?.data
            })
            throw error
        }
    }

    async createProject(headers, projectData) {
        const userId = headers['x-user-id']
        try {
            const response = await this.axios.post(`/projects/create`, {
                headers: {
                    "x-user-id": userId
                },
                body: projectData
            })
            return response.data
        } catch (error) {
            logger.error('Error creating project', {
                userId,
                error: error.message,
                response: error.response?.data,
                projectData: projectData
            })
            throw error
        }
    }

    async checkUserPermissions(userId, correlationId) {
        try {
            const response = await this.axios.get(`/${userId}/permissions`, {
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
            await this.axios.post(`/${userId}/datasets`, {
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
            const response = await this.axios.get(`/${userId}/datasets/${datasetId}`, {
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