import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket',
      required: true,
      index: true
    },
    ticketReference: {
      type: String,
      required: true,
      index: true
    },
    actor: {
      name: { type: String, required: true },
      email: { type: String, default: '' },
      role: { type: String, enum: ['admin', 'agent', 'customer', 'system'], default: 'system' },
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
    },
    action: {
      type: String,
      enum: [
        'TICKET_CREATED',
        'TICKET_ASSIGNED',
        'TICKET_REASSIGNED',
        'STATUS_CHANGED',
        'PRIORITY_CHANGED',
        'PUBLIC_REPLY_ADDED',
        'INTERNAL_NOTE_ADDED',
        'TICKET_RESOLVED'
      ],
      required: true
    },
    description: {
      type: String,
      required: true
    },
    previousValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: false
  }
);

activitySchema.index({ ticket: 1, createdAt: 1 });
activitySchema.index({ ticketReference: 1, createdAt: 1 });

const Activity = mongoose.model('Activity', activitySchema);
export default Activity;

