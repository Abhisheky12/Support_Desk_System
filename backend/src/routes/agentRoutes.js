import express from 'express';
import { getAgents, createAgent, updateAgent } from '../controllers/agentController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roleMiddleware.js';
import { validateAgentInput } from '../middlewares/validationMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getAgents);
router.post('/', requireRole('admin'), validateAgentInput, createAgent);
router.patch('/:id', requireRole('admin'), updateAgent);

export default router;

