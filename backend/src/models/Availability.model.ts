import mongoose, { Document, Schema } from 'mongoose';

export interface IAvailability extends Document {
  teacher: mongoose.Types.ObjectId;
  workingHours: {
    start: string; // "09:00"
    end: string;   // "18:00"
  };
  workingDays: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  holidays: Date[];
  blockedSlots: {
    start: Date;
    end: Date;
    reason?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const AvailabilitySchema = new Schema<IAvailability>(
  {
    teacher: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    workingHours: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '18:00' },
    },
    workingDays: { type: [Number], default: [1, 2, 3, 4, 5] }, // Mon-Fri
    holidays: [{ type: Date }],
    blockedSlots: [
      {
        start: { type: Date, required: true },
        end: { type: Date, required: true },
        reason: { type: String },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<IAvailability>('Availability', AvailabilitySchema);
