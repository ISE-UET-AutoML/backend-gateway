import express from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import UserServiceController from './controller.js'
const router = express.Router();

// Route /login chỉ gọi hàm xử lý từ userService.js
router.use('/login', UserServiceController.login);

// Proxy các route khác

router.use('/register', UserServiceController.register);

// router.use('/me', authMiddleware, UserServiceController.getUserById);
router.use('/projects', authMiddleware);

// router.use("/projects/create", authMiddleware, UserServiceController.createProject);
// router.use("/projects/:projectId", authMiddleware, UserServiceController.getProjectById);
// router.use("/projects/:projectId/delete", authMiddleware, UserServiceController.deleteProject);

// router.use("/projects/:projectId/", authMiddleware, UserServiceController.getProjectById);
// router.use("/projects/:projectId/addCollaborator", authMiddleware, UserServiceController.addCollaboratorToProject)
// router.use("/projects/:projectId/deleteCollaborator", authMiddleware, UserServiceController.deleteCollaboratorFromProject)


// Protected routes (require auth)
// router.use('/', authMiddleware);

export default router;
