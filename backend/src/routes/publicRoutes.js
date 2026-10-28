import express from 'express';
import {
  submitPublicTicket,
  trackPublicTicket,
  getPublicTicketMessages,
  submitCustomerReply
} from '../controllers/publicTicketController.js';
import { validateTicketInput } from '../middlewares/validationMiddleware.js';

const router = express.Router();

router.post('/tickets', validateTicketInput, submitPublicTicket);
router.get('/tickets/:reference', trackPublicTicket);
router.get('/tickets/:reference/messages', getPublicTicketMessages);
router.post('/tickets/:reference/messages', submitCustomerReply);

export default router;

