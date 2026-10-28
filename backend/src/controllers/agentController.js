import User from '../models/User.js';
import Ticket from '../models/Ticket.js';

export const getAgents = async (req, res, next) => {
  try {
    const agents = await User.find({}).sort({ createdAt: -1 });

    // Calculate active ticket load for each agent
    const activeTicketCounts = await Ticket.aggregate([
      { $match: { status: { $ne: 'Resolved' }, assignedTo: { $ne: null } } },
      { $group: { _id: '$assignedTo', count: { $sum: 1 } } }
    ]);

    const countMap = {};
    activeTicketCounts.forEach((item) => {
      countMap[item._id.toString()] = item.count;
    });

    const agentsWithCounts = agents.map((agent) => ({
      ...agent.toJSON(),
      activeTickets: countMap[agent._id.toString()] || 0
    }));

    res.status(200).json({
      success: true,
      data: agentsWithCounts
    });
  } catch (error) {
    next(error);
  }
};

export const createAgent = async (req, res, next) => {
  try {
    const { name, email, password, role = 'agent' } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email address already exists.'
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: role === 'admin' ? 'admin' : 'agent',
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Agent created successfully',
      data: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

export const updateAgent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, role, isActive } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    if (name) user.name = name.trim();
    if (role && ['admin', 'agent'].includes(role)) user.role = role;
    if (typeof isActive === 'boolean') user.isActive = isActive;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Agent updated successfully',
      data: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

