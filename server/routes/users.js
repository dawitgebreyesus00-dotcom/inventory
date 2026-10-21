import express from 'express';
import { getUsers, getUserById, updateUser, deleteUser, getMe, updateMe, createUser } from '../controllers/usersController.js';

const router = express.Router();
import { verifyToken, requireAdmin } from '../middleware/authMiddleware.js';

router.get('/', verifyToken, requireAdmin, getUsers);
router.post('/', verifyToken, requireAdmin, createUser);
router.get('/me', verifyToken, getMe);
router.patch('/me', verifyToken, updateMe);
router.get('/:id', verifyToken, requireAdmin, getUserById);
router.patch('/:id', verifyToken, requireAdmin, updateUser);
router.delete('/:id', verifyToken, requireAdmin, deleteUser);

export default router;
