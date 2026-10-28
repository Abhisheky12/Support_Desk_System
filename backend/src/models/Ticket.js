import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [200, 'Subject cannot exceed 200 characters']
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      maxlength: [100, 'Customer name cannot exceed 100 characters']
    },
    customerEmail: {
      type: String,
      required: [true, 'Customer email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid customer email']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true
    },
    priority: {
      type: String,
      enum: {
        values: ['Low', 'Medium', 'High', 'Urgent'],
        message: '{VALUE} is not a valid priority'
      },
      default: 'Medium',
      index: true
    },
    status: {
      type: String,
      enum: {
        values: ['Open', 'In Progress', 'Waiting on Customer', 'Resolved'],
        message: '{VALUE} is not a valid status'
      },
      default: 'Open',
      index: true
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    accessTokenHash: {
      type: String,
      select: false
    },
    resolvedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual property: isOverdue
// Business Rule: A ticket is overdue if status is not 'Resolved' AND created > 24 hours ago.
// When marked Resolved, it must NEVER count as overdue.
ticketSchema.virtual('isOverdue').get(function () {
  if (this.status === 'Resolved') return false;
  if (!this.createdAt) return false;
  const ageInMs = Date.now() - new Date(this.createdAt).getTime();
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  return ageInMs > TWENTY_FOUR_HOURS;
});

// Priority numeric weight helper for MongoDB sorting
ticketSchema.virtual('priorityWeight').get(function () {
  const weights = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
  return weights[this.priority] || 0;
});

ticketSchema.methods.toJSON = function () {
  const obj = this.toObject({ virtuals: true });
  delete obj.accessTokenHash;
  return obj;
};

// Indexes for query performance
ticketSchema.index({ status: 1, priority: 1 });
ticketSchema.index({ createdAt: -1 });
ticketSchema.index({ updatedAt: -1 });
ticketSchema.index({ subject: 'text', customerName: 'text', customerEmail: 'text', reference: 'text' });

const Ticket = mongoose.model('Ticket', ticketSchema);
export default Ticket;

