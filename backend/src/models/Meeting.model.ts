import mongoose, { Document, Schema } from 'mongoose';

export type MeetingType = 'Interview' | 'Technical Assessment' | 'Training' | 'Classroom' | 'Mentorship' | 'Mock Interview' | 'Group Discussion';
export type MeetingStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled' | 'rescheduled';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';

export interface IMeeting extends Document {
  title: string;
  description: string;
  meetingType: MeetingType;
  organizer: mongoose.Types.ObjectId;
  candidates: mongoose.Types.ObjectId[];
  startTime: Date;
  endTime: Date;
  googleMeetLink: string;
  googleEventId: string;
  status: MeetingStatus;
  recurrence: RecurrenceType;
  recurrenceEndDate?: Date;
  notes?: string;
  cancelledAt?: Date;
  cancelReason?: string;
  rescheduledFrom?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MeetingSchema = new Schema<IMeeting>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    meetingType: {
      type: String,
      enum: ['Interview', 'Technical Assessment', 'Training', 'Classroom', 'Mentorship', 'Mock Interview', 'Group Discussion'],
      required: true,
    },
    organizer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    candidates: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    googleMeetLink: { type: String, default: '' },
    googleEventId: { type: String, default: '' },
    status: {
      type: String,
      enum: ['scheduled', 'ongoing', 'completed', 'cancelled', 'rescheduled'],
      default: 'scheduled',
    },
    recurrence: {
      type: String,
      enum: ['none', 'daily', 'weekly', 'monthly'],
      default: 'none',
    },
    recurrenceEndDate: { type: Date },
    notes: { type: String },
    cancelledAt: { type: Date },
    cancelReason: { type: String },
    rescheduledFrom: { type: Date },
  },
  { timestamps: true }
);

MeetingSchema.index({ organizer: 1, startTime: -1 });
MeetingSchema.index({ candidates: 1, startTime: -1 });
MeetingSchema.index({ status: 1 });

export default mongoose.model<IMeeting>('Meeting', MeetingSchema);
