import express from 'express';
import { getTicketActivity } from '../controllers/activityController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router({ mergeParams: true });

router.use(authenticate);

router.get('/:id/activity', getTicketActivity);

export default router;

