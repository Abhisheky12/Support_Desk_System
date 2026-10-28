import express from 'express';
import {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  assignTicket,
  deleteTicket
} from '../controllers/ticketController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roleMiddleware.js';
import { validateTicketInput } from '../middlewares/validationMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getTickets);
router.post('/', validateTicketInput, createTicket);
router.get('/:id', getTicketById);
router.patch('/:id', updateTicket);
// Assignment restricted to Admin as per specification, or both admin and agent if desired
router.patch('/:id/assign', requireRole('admin'), assignTicket);
router.delete('/:id', requireRole('admin'), deleteTicket);

export default router;

