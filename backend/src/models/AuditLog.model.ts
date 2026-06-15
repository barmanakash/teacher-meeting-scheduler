import mongoose, { Document, Schema } from 'mongoose';

export type AuditAction =
  | 'user_login'
  | 'meeting_created'
  | 'meeting_updated'
  | 'meeting_cancelled'
  | 'attendance_updated'
  | 'report_downloaded';

export interface IAuditLog extends Document {
  user: mongoose.Types.ObjectId;
  action: AuditAction;
  resource?: string;
  resourceId?: string;
  details?: Record<string, any>;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: {
      type: String,
      enum: ['user_login', 'meeting_created', 'meeting_updated', 'meeting_cancelled', 'attendance_updated', 'report_downloaded'],
      required: true,
    },
    resource: { type: String },
    resourceId: { type: String },
    details: { type: Schema.Types.Mixed },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

AuditLogSchema.index({ user: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1 });

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
