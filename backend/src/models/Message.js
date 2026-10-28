import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: {
        values: ['public', 'internal'],
        message: '{VALUE} must be either public or internal'
      },
      required: true,
      default: 'public',
      index: true
    },
    senderRole: {
      type: String,
      enum: ['admin', 'agent', 'customer'],
      required: true
    },
    senderName: {
      type: String,
      required: [true, 'Sender name is required'],
      trim: true
    },
    senderUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    content: {
      type: String,
      required: [true, 'Message content cannot be empty'],
      trim: true,
      minlength: [1, 'Message content cannot be empty']
    }
  },
  {
    timestamps: true
  }
);

messageSchema.index({ ticket: 1, createdAt: 1 });
messageSchema.index({ ticketReference: 1, type: 1, createdAt: 1 });

const Message = mongoose.model('Message', messageSchema);
export default Message;

