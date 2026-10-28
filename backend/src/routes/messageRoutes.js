import express from 'express';
import { getTicketMessages, createTicketMessage } from '../controllers/messageController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { validateMessageInput } from '../middlewares/validationMiddleware.js';

const router = express.Router({ mergeParams: true });

router.use(authenticate);

router.get('/:id/messages', getTicketMessages);
router.post('/:id/messages', validateMessageInput, createTicketMessage);

export default router;

