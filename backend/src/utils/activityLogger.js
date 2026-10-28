import Activity from '../models/Activity.js';

/**
 * Helper to record audit history for ticket actions
 */
export const logActivity = async ({
  ticketId,
  ticketReference,
  actor,
  action,
  description,
  previousValue = null,
  newValue = null
}) => {
  try {
    const activity = await Activity.create({
      ticket: ticketId,
      ticketReference,
      actor: {
        name: actor?.name || 'System',
        email: actor?.email || '',
        role: actor?.role || 'system',
        id: actor?._id || actor?.id || null
      },
      action,
      description,
      previousValue,
      newValue,
      createdAt: new Date()
    });
    return activity;
  } catch (error) {
    console.error(`[Activity Log Error]: ${error.message}`);
    return null;
  }
};

