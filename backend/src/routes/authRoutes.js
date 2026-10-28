import express from 'express';
import { login, logout, getMe } from '../controllers/authController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { validateLoginInput } from '../middlewares/validationMiddleware.js';

const router = express.Router();

router.post('/login', validateLoginInput, login);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);

export default router;

