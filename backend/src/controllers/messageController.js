import mongoose from 'mongoose';
import Message from '../models/Message.js';
import Ticket from '../models/Ticket.js';
import { logActivity } from '../utils/activityLogger.js';

export const getTicketMessages = async (req, res, next) => {
  try {
    const { id } = req.params;

    let ticket;
    if (mongoose.Types.ObjectId.isValid(id)) {
      ticket = await Ticket.findById(id);
    } else {
      ticket = await Ticket.findOne({ reference: id.toUpperCase() });
    }

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Chronological order: oldest first
    const messages = await Message.find({ ticket: ticket._id })
      .populate('senderUser', 'name email role')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error) {
    next(error);
  }
};

export const createTicketMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content, type = 'public' } = req.body;

    let ticket;
    if (mongoose.Types.ObjectId.isValid(id)) {
      ticket = await Ticket.findById(id);
    } else {
      ticket = await Ticket.findOne({ reference: id.toUpperCase() });
    }

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Explicit type validation: only 'public' or 'internal'
    const messageType = type === 'internal' ? 'internal' : 'public';

    const message = await Message.create({
      ticket: ticket._id,
      ticketReference: ticket.reference,
      type: messageType,
      senderRole: req.user.role,
      senderName: req.user.name,
      senderUser: req.user._id,
      content: content.trim()
    });

    // Touch ticket updatedAt timestamp
    ticket.updatedAt = new Date();
    await ticket.save();

    // Audit in Activity History
    const action = messageType === 'internal' ? 'INTERNAL_NOTE_ADDED' : 'PUBLIC_REPLY_ADDED';
    const description = `${messageType === 'internal' ? 'Internal note' : 'Public reply'} added by ${req.user.name}`;

    await logActivity({
      ticketId: ticket._id,
      ticketReference: ticket.reference,
      actor: req.user,
      action,
      description,
      newValue: {
        type: messageType,
        snippet: content.trim().substring(0, 80)
      }
    });

    const populated = await Message.findById(message._id).populate('senderUser', 'name email role');

    res.status(201).json({
      success: true,
      message: `${messageType === 'internal' ? 'Internal note' : 'Public reply'} submitted successfully`,
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

