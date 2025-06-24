import logger from '../../utils/logger.js';
import userService from './userService.js';

class UserServiceController {
    static async login(req, res, next) {
        const { email, password } = req.body
        try {
            const { accessToken, refreshToken, user } = await userService.handleLogin(email, password)
            res.json({ accessToken, refreshToken, user})
        } catch (error) {
            logger.error('Error in login controller', {
                error: error.message,
                // userId: req.user.id,
                correlationId: req.correlationId
            });
            res.status(400).json({"error": "Error in login controller"})
            if (error.message.includes('permission')) {
                return res.status(403).json({
                error: 'Forbidden',
                message: error.message
                });
            }
            next(error);
        }
    }

    static async register(req, res, next) {
        const userData = req.body
        try {
            const result = await userService.register(userData)
            res.status(200).json(result)
        } catch (error) {
            logger.error('Error in register controller', {
                error: error.message,
                respose: error.response?.data,
                correlationId: req.correlationId
            });
            res.status(400).json(error.response?.data)
            next(error)
        }
    }

    // static async getUserProjects(req, res, next) {
    //     try {
    //         const headers = req.headers;
    //         const projects = await userService.getUserProjects(headers);
    //         res.status(200).json(projects);
    //     } catch (error) {
    //         logger.error('Error in register controller', {
    //             error: error.message,
    //             respose: error.response?.data,
    //             correlationId: req.correlationId
    //         });
    //         res.status(500).json({ error: error.response });
    //         next(error)
    //     }
    // }

    // static async createProject(req, res, next) {
    //     try {
    //         const headers = req.headers;
    //         const projectData = req.body;
    //         const project = await userService.createProject(headers, projectData);
    //         res.status(200).json(project);
    //     } catch (error) {
    //         logger.error('Error in createProject controller', {
    //             error: error.message,
    //             respose: error.response?.data,
    //             correlationId: req.correlationId
    //         });
    //         res.status(500).json({ error: error.response });
    //         next(error)
    //     }
    // }
}
export default UserServiceController