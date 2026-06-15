import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType = 'invitation' | 'reminder_24h' | 'reminder_1h' | 'reminder_15m' | 'cancellation' | 'reschedule';

export interface INotification extends Document {
  meeting: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  type: NotificationType;
  sentAt?: Date;
  scheduledAt: Date;
  status: 'pending' | 'sent' | 'failed';
  error?: string;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    meeting: { type: Schema.Types.ObjectId, ref: 'Meeting', required: true },
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['invitation', 'reminder_24h', 'reminder_1h', 'reminder_15m', 'cancellation', 'reschedule'],
      required: true,
    },
    sentAt: { type: Date },
    scheduledAt: { type: Date, required: true },
    status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
    error: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<INotification>('Notification', NotificationSchema);
