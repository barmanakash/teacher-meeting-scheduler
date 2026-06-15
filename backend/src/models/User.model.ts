import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  googleId: string;
  name: string;
  email: string;
  profileImage: string;
  role: 'teacher' | 'candidate';
  refreshToken?: string;
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    googleId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    profileImage: { type: String, default: '' },
    role: { type: String, enum: ['teacher', 'candidate'], default: 'candidate' },
    refreshToken: { type: String },
    lastLogin: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
