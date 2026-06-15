import mongoose, { Document, Schema } from 'mongoose';

export type AttendanceStatus = 'present' | 'late' | 'left_early' | 'absent';

export interface IAttendance extends Document {
  meeting: mongoose.Types.ObjectId;
  candidate: mongoose.Types.ObjectId;
  joinTime?: Date;
  leaveTime?: Date;
  duration?: number; // in minutes
  status: AttendanceStatus;
  markedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    meeting: { type: Schema.Types.ObjectId, ref: 'Meeting', required: true },
    candidate: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    joinTime: { type: Date },
    leaveTime: { type: Date },
    duration: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['present', 'late', 'left_early', 'absent'],
      default: 'absent',
    },
    markedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

AttendanceSchema.index({ meeting: 1, candidate: 1 }, { unique: true });
AttendanceSchema.index({ candidate: 1, createdAt: -1 });

export default mongoose.model<IAttendance>('Attendance', AttendanceSchema);
