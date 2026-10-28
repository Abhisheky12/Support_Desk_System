import Ticket from '../models/Ticket.js';
import User from '../models/User.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Run parallel aggregation queries for optimal performance
    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      waitingTickets,
      resolvedTickets,
      urgentTickets,
      overdueTickets,
      priorityBreakdown,
      statusBreakdown,
      agentWorkload
    ] = await Promise.all([
      // 1. Total tickets
      Ticket.countDocuments({}),

      // 2. Open tickets
      Ticket.countDocuments({ status: 'Open' }),

      // 3. In Progress tickets
      Ticket.countDocuments({ status: 'In Progress' }),

      // 4. Waiting on Customer
      Ticket.countDocuments({ status: 'Waiting on Customer' }),

      // 5. Resolved tickets
      Ticket.countDocuments({ status: 'Resolved' }),

      // 6. Urgent tickets (active urgent or all urgent)
      Ticket.countDocuments({ priority: 'Urgent' }),

      // 7. Overdue tickets:
      // STRICT BUSINESS RULE: status is NOT Resolved AND created > 24 hours ago
      Ticket.countDocuments({
        status: { $ne: 'Resolved' },
        createdAt: { $lte: twentyFourHoursAgo }
      }),

      // Priority Breakdown
      Ticket.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]),

      // Status Breakdown
      Ticket.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),

      // Agent Workload
      Ticket.aggregate([
        { $match: { status: { $ne: 'Resolved' } } },
        {
          $group: {
            _id: '$assignedTo',
            activeCount: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'agent'
          }
        },
        {
          $unwind: {
            path: '$agent',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            agentId: '$_id',
            agentName: { $ifNull: ['$agent.name', 'Unassigned'] },
            activeCount: 1
          }
        }
      ])
    ]);

    // Format breakdowns as key-value objects
    const priorities = { Low: 0, Medium: 0, High: 0, Urgent: 0 };
    priorityBreakdown.forEach((item) => {
      if (item._id) priorities[item._id] = item.count;
    });

    const statuses = { Open: 0, 'In Progress': 0, 'Waiting on Customer': 0, Resolved: 0 };
    statusBreakdown.forEach((item) => {
      if (item._id) statuses[item._id] = item.count;
    });

    res.status(200).json({
      success: true,
      data: {
        totalTickets,
        openTickets,
        inProgressTickets,
        waitingTickets,
        resolvedTickets,
        urgentTickets,
        overdueTickets,
        breakdown: {
          byPriority: priorities,
          byStatus: statuses
        },
        agentWorkload
      }
    });
  } catch (error) {
    next(error);
  }
};

