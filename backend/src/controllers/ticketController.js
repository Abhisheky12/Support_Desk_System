import mongoose from 'mongoose';
import Ticket from '../models/Ticket.js';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Activity from '../models/Activity.js';
import { generateTicketReference, generateAccessToken, hashAccessToken } from '../utils/ticketReference.js';
import { logActivity } from '../utils/activityLogger.js';

export const getTickets = async (req, res, next) => {
  try {
    const {
      search,
      status,
      priority,
      assignedTo,
      sortBy = 'updatedAt_desc',
      page = 1,
      limit = 10
    } = req.query;

    const query = {};

    // 1. Text Search across subject, customerName, customerEmail, reference
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { subject: searchRegex },
        { customerName: searchRegex },
        { customerEmail: searchRegex },
        { reference: searchRegex }
      ];
    }

    // 2. Status Filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // 3. Priority Filter
    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    // 4. Assignee Filter
    if (assignedTo) {
      if (assignedTo === 'unassigned') {
        query.assignedTo = null;
      } else if (assignedTo === 'me' && req.user) {
        query.assignedTo = req.user._id;
      } else if (mongoose.Types.ObjectId.isValid(assignedTo)) {
        query.assignedTo = assignedTo;
      }
    }

    // Parse pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Build pipeline or query for sorting
    // Priority sorting requirement: Urgent > High > Medium > Low
    let tickets = [];
    let total = 0;

    if (sortBy === 'priority_desc') {
      // Use aggregation pipeline to sort by custom priority weights
      const pipeline = [
        { $match: query },
        {
          $addFields: {
            priorityWeight: {
              $switch: {
                branches: [
                  { case: { $eq: ['$priority', 'Urgent'] }, then: 4 },
                  { case: { $eq: ['$priority', 'High'] }, then: 3 },
                  { case: { $eq: ['$priority', 'Medium'] }, then: 2 },
                  { case: { $eq: ['$priority', 'Low'] }, then: 1 }
                ],
                default: 0
              }
            }
          }
        },
        { $sort: { priorityWeight: -1, updatedAt: -1 } },
        {
          $facet: {
            metadata: [{ $count: 'total' }],
            data: [
              { $skip: skip },
              { $limit: limitNum },
              {
                $lookup: {
                  from: 'users',
                  localField: 'assignedTo',
                  foreignField: '_id',
                  as: 'assignedToUser'
                }
              },
              {
                $unwind: {
                  path: '$assignedToUser',
                  preserveNullAndEmptyArrays: true
                }
              },
              {
                $project: {
                  reference: 1,
                  subject: 1,
                  customerName: 1,
                  customerEmail: 1,
                  description: 1,
                  priority: 1,
                  status: 1,
                  resolvedAt: 1,
                  createdAt: 1,
                  updatedAt: 1,
                  assignedTo: {
                    _id: '$assignedToUser._id',
                    name: '$assignedToUser.name',
                    email: '$assignedToUser.email',
                    role: '$assignedToUser.role'
                  }
                }
              }
            ]
          }
        }
      ];

      const result = await Ticket.aggregate(pipeline);
      total = result[0]?.metadata[0]?.total || 0;
      const rawTickets = result[0]?.data || [];

      // Add virtuals like isOverdue
      const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
      const now = Date.now();
      tickets = rawTickets.map((t) => ({
        ...t,
        isOverdue: t.status !== 'Resolved' && now - new Date(t.createdAt).getTime() > TWENTY_FOUR_HOURS
      }));
    } else {
      let sort = { updatedAt: -1 };
      if (sortBy === 'updatedAt_asc') sort = { updatedAt: 1 };
      if (sortBy === 'createdAt_desc') sort = { createdAt: -1 };
      if (sortBy === 'createdAt_asc') sort = { createdAt: 1 };

      total = await Ticket.countDocuments(query);
      const rawTickets = await Ticket.find(query)
        .populate('assignedTo', 'name email role')
        .sort(sort)
        .skip(skip)
        .limit(limitNum);

      tickets = rawTickets.map((t) => t.toJSON());
    }

    res.status(200).json({
      success: true,
      data: tickets,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getTicketById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let ticket;
    if (mongoose.Types.ObjectId.isValid(id)) {
      ticket = await Ticket.findById(id).populate('assignedTo', 'name email role');
    } else {
      // Find by reference (e.g. TCK-123456)
      ticket = await Ticket.findOne({ reference: id.toUpperCase() }).populate('assignedTo', 'name email role');
    }

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: `Ticket with identifier '${id}' was not found.`
      });
    }

    res.status(200).json({
      success: true,
      data: ticket.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

export const createTicket = async (req, res, next) => {
  try {
    const { subject, customerName, customerEmail, description, priority = 'Medium', status = 'Open', assignedTo } = req.body;

    const reference = await generateTicketReference();
    const plainAccessToken = generateAccessToken();
    const accessTokenHash = hashAccessToken(plainAccessToken);

    let assignedUser = null;
    if (assignedTo && mongoose.Types.ObjectId.isValid(assignedTo)) {
      assignedUser = await User.findById(assignedTo);
    }

    const ticket = await Ticket.create({
      reference,
      subject: subject.trim(),
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim().toLowerCase(),
      description: description.trim(),
      priority,
      status,
      assignedTo: assignedUser ? assignedUser._id : null,
      accessTokenHash,
      resolvedAt: status === 'Resolved' ? new Date() : null
    });

    // Record creation in Activity history
    await logActivity({
      ticketId: ticket._id,
      ticketReference: ticket.reference,
      actor: req.user,
      action: 'TICKET_CREATED',
      description: `Ticket created by ${req.user.name} (${req.user.role}) with priority '${priority}'`,
      newValue: { status, priority, subject: ticket.subject }
    });

    if (assignedUser) {
      await logActivity({
        ticketId: ticket._id,
        ticketReference: ticket.reference,
        actor: req.user,
        action: 'TICKET_ASSIGNED',
        description: `Ticket initially assigned to ${assignedUser.name}`,
        newValue: assignedUser.name
      });
    }

    const populatedTicket = await Ticket.findById(ticket._id).populate('assignedTo', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      data: populatedTicket.toJSON(),
      // Provide plain access token upon creation for customer delivery
      accessToken: plainAccessToken
    });
  } catch (error) {
    next(error);
  }
};

export const updateTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, priority, subject, description } = req.body;

    const ticket = await Ticket.findById(id).populate('assignedTo', 'name email role');
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Status change logic
    if (status && status !== ticket.status) {
      const oldStatus = ticket.status;
      ticket.status = status;

      if (status === 'Resolved') {
        ticket.resolvedAt = new Date();
        await logActivity({
          ticketId: ticket._id,
          ticketReference: ticket.reference,
          actor: req.user,
          action: 'TICKET_RESOLVED',
          description: `Ticket resolved by ${req.user.name}`,
          previousValue: oldStatus,
          newValue: 'Resolved'
        });
      } else {
        ticket.resolvedAt = null;
      }

      await logActivity({
        ticketId: ticket._id,
        ticketReference: ticket.reference,
        actor: req.user,
        action: 'STATUS_CHANGED',
        description: `Status changed from '${oldStatus}' to '${status}' by ${req.user.name}`,
        previousValue: oldStatus,
        newValue: status
      });
    }

    // Priority change logic
    if (priority && priority !== ticket.priority) {
      const oldPriority = ticket.priority;
      ticket.priority = priority;

      await logActivity({
        ticketId: ticket._id,
        ticketReference: ticket.reference,
        actor: req.user,
        action: 'PRIORITY_CHANGED',
        description: `Priority changed from '${oldPriority}' to '${priority}' by ${req.user.name}`,
        previousValue: oldPriority,
        newValue: priority
      });
    }

    if (subject) ticket.subject = subject.trim();
    if (description) ticket.description = description.trim();

    await ticket.save();

    const updated = await Ticket.findById(ticket._id).populate('assignedTo', 'name email role');

    res.status(200).json({
      success: true,
      message: 'Ticket updated successfully',
      data: updated.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

export const assignTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { agentId } = req.body;

    const ticket = await Ticket.findById(id).populate('assignedTo', 'name email role');
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    const previousAssignee = ticket.assignedTo ? ticket.assignedTo.name : 'Unassigned';

    if (!agentId || agentId === 'unassigned') {
      ticket.assignedTo = null;
      await ticket.save();

      await logActivity({
        ticketId: ticket._id,
        ticketReference: ticket.reference,
        actor: req.user,
        action: 'TICKET_REASSIGNED',
        description: `Ticket unassigned from ${previousAssignee} by ${req.user.name}`,
        previousValue: previousAssignee,
        newValue: 'Unassigned'
      });
    } else {
      if (!mongoose.Types.ObjectId.isValid(agentId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid agent ID format'
        });
      }

      const agent = await User.findById(agentId);
      if (!agent) {
        return res.status(404).json({
          success: false,
          message: 'Agent not found'
        });
      }

      if (!agent.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Cannot assign to a deactivated agent.'
        });
      }

      const action = ticket.assignedTo ? 'TICKET_REASSIGNED' : 'TICKET_ASSIGNED';
      ticket.assignedTo = agent._id;
      await ticket.save();

      await logActivity({
        ticketId: ticket._id,
        ticketReference: ticket.reference,
        actor: req.user,
        action,
        description: `Ticket ${action === 'TICKET_REASSIGNED' ? 'reassigned' : 'assigned'} to ${agent.name} by ${req.user.name}`,
        previousValue: previousAssignee,
        newValue: agent.name
      });
    }

    const updated = await Ticket.findById(ticket._id).populate('assignedTo', 'name email role');

    res.status(200).json({
      success: true,
      message: 'Ticket assignment updated successfully',
      data: updated.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Maintain data integrity by removing associated messages and activities
    await Message.deleteMany({ ticket: ticket._id });
    await Activity.deleteMany({ ticket: ticket._id });
    await Ticket.findByIdAndDelete(ticket._id);

    res.status(200).json({
      success: true,
      message: 'Ticket and associated records deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

