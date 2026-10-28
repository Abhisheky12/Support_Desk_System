import mongoose from 'mongoose';
import Activity from '../models/Activity.js';
import Ticket from '../models/Ticket.js';

export const getTicketActivity = async (req, res, next) => {
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
    const activities = await Activity.find({ ticket: ticket._id }).sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: activities
    });
  } catch (error) {
    next(error);
  }
};

