import Ticket from '../models/Ticket.js';
import Message from '../models/Message.js';
import {
  generateTicketReference,
  generateAccessToken,
  hashAccessToken,
  verifyAccessToken
} from '../utils/ticketReference.js';
import { logActivity } from '../utils/activityLogger.js';

/**
 * Customer submits a new support ticket
 */
export const submitPublicTicket = async (req, res, next) => {
  try {
    const { subject, customerName, customerEmail, description, priority = 'Medium' } = req.body;

    const reference = await generateTicketReference();
    const plainAccessToken = generateAccessToken();
    const accessTokenHash = hashAccessToken(plainAccessToken);

    const ticket = await Ticket.create({
      reference,
      subject: subject.trim(),
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim().toLowerCase(),
      description: description.trim(),
      priority: ['Low', 'Medium', 'High', 'Urgent'].includes(priority) ? priority : 'Medium',
      status: 'Open',
      accessTokenHash,
      resolvedAt: null
    });

    // Audit trail
    await logActivity({
      ticketId: ticket._id,
      ticketReference: ticket.reference,
      actor: {
        name: customerName.trim(),
        email: customerEmail.trim().toLowerCase(),
        role: 'customer'
      },
      action: 'TICKET_CREATED',
      description: `Ticket submitted by customer ${customerName.trim()} (${customerEmail.trim()})`,
      newValue: {
        reference: ticket.reference,
        subject: ticket.subject,
        priority: ticket.priority
      }
    });

    res.status(201).json({
      success: true,
      message: 'Support ticket submitted successfully.',
      data: {
        reference: ticket.reference,
        accessToken: plainAccessToken,
        subject: ticket.subject,
        status: ticket.status,
        createdAt: ticket.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Customer tracks their ticket using Reference + Access Token
 */
export const trackPublicTicket = async (req, res, next) => {
  try {
    const { reference } = req.params;
    const token = req.query.token || req.headers['x-ticket-token'];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'A valid ticket access token is required to view this ticket.'
      });
    }

    const ticket = await Ticket.findOne({ reference: reference.toUpperCase() })
      .select('+accessTokenHash')
      .populate('assignedTo', 'name');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: `Ticket '${reference}' not found.`
      });
    }

    // Cryptographic verification against stored access token hash
    const isValidToken = verifyAccessToken(token, ticket.accessTokenHash);
    if (!isValidToken) {
      return res.status(403).json({
        success: false,
        message: 'Invalid tracking token. Access denied.'
      });
    }

    // Return sanitized customer view (never internal details)
    const publicData = {
      reference: ticket.reference,
      subject: ticket.subject,
      customerName: ticket.customerName,
      customerEmail: ticket.customerEmail,
      description: ticket.description,
      priority: ticket.priority,
      status: ticket.status,
      assignedAgentName: ticket.assignedTo ? ticket.assignedTo.name : 'Support Team',
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      resolvedAt: ticket.resolvedAt
    };

    res.status(200).json({
      success: true,
      data: publicData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Customer fetches messages: ONLY public replies, NEVER internal notes
 */
export const getPublicTicketMessages = async (req, res, next) => {
  try {
    const { reference } = req.params;
    const token = req.query.token || req.headers['x-ticket-token'];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'A valid ticket access token is required.'
      });
    }

    const ticket = await Ticket.findOne({ reference: reference.toUpperCase() }).select('+accessTokenHash');
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found.'
      });
    }

    const isValidToken = verifyAccessToken(token, ticket.accessTokenHash);
    if (!isValidToken) {
      return res.status(403).json({
        success: false,
        message: 'Invalid tracking token. Access denied.'
      });
    }

    // CRITICAL SECURITY RULE: NEVER fetch internal notes for customer
    const messages = await Message.find({
      ticket: ticket._id,
      type: 'public'
    })
      .select('content senderRole senderName createdAt')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Customer adds a public reply to their ticket
 */
export const submitCustomerReply = async (req, res, next) => {
  try {
    const { reference } = req.params;
    const { content } = req.body;
    const token = req.query.token || req.headers['x-ticket-token'] || req.body.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required to reply.'
      });
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Reply content cannot be empty.'
      });
    }

    const ticket = await Ticket.findOne({ reference: reference.toUpperCase() }).select('+accessTokenHash');
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found.'
      });
    }

    const isValidToken = verifyAccessToken(token, ticket.accessTokenHash);
    if (!isValidToken) {
      return res.status(403).json({
        success: false,
        message: 'Invalid tracking token. Access denied.'
      });
    }

    // Customer replies are ALWAYS public
    const message = await Message.create({
      ticket: ticket._id,
      ticketReference: ticket.reference,
      type: 'public',
      senderRole: 'customer',
      senderName: ticket.customerName,
      senderUser: null,
      content: content.trim()
    });

    // Touch ticket updatedAt
    ticket.updatedAt = new Date();

    // If ticket was waiting on customer, flip to In Progress
    let statusUpdated = false;
    if (ticket.status === 'Waiting on Customer') {
      ticket.status = 'In Progress';
      statusUpdated = true;
    }
    await ticket.save();

    await logActivity({
      ticketId: ticket._id,
      ticketReference: ticket.reference,
      actor: {
        name: ticket.customerName,
        email: ticket.customerEmail,
        role: 'customer'
      },
      action: 'PUBLIC_REPLY_ADDED',
      description: `Customer ${ticket.customerName} replied to ticket`,
      newValue: {
        snippet: content.trim().substring(0, 80)
      }
    });

    if (statusUpdated) {
      await logActivity({
        ticketId: ticket._id,
        ticketReference: ticket.reference,
        actor: {
          name: ticket.customerName,
          email: ticket.customerEmail,
          role: 'customer'
        },
        action: 'STATUS_CHANGED',
        description: `Status automatically shifted to 'In Progress' following customer response`,
        previousValue: 'Waiting on Customer',
        newValue: 'In Progress'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Reply posted successfully',
      data: {
        content: message.content,
        senderRole: message.senderRole,
        senderName: message.senderName,
        createdAt: message.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

