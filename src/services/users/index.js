import express from 'express';
import UserServiceController from './controller.js'
const router = express.Router();

// Route /login chỉ gọi hàm xử lý từ userService.js
router.post('/login', UserServiceController.login);
router.use('/register', UserServiceController.register);

export default router;
