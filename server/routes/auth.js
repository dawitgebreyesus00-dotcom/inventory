import express from 'express';
import { login, refreshToken } from '../controllers/authController.js';

const router = express.Router();

// Login route
router.post('/login', login);

// Refresh token route
router.post('/refresh-token', refreshToken);
router.post('/refresh', refreshToken);

export default router;
