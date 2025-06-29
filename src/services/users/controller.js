import logger from '../../utils/logger.js';
import userService from './userService.js';

class UserServiceController {
    static async login(req, res, next) {
        const { email, password } = req.body
        try {
            const { accessToken, refreshToken, user } = await userService.handleLogin(email, password)
            res.json({ accessToken, refreshToken, user })
        } catch (error) {
            logger.error('Error in login controller', {
                error: error.message,
                response: error.response?.data,
                correlationId: req.correlationId
            });
            res.status(400).json(error.response?.data || { "error": error.message })
            // next(error);
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
            res.status(400).json(error.response?.data || { "error": error.message })
            // next(error)
        }
    }
}
export default UserServiceController