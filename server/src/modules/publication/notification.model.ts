import { Schema, model, Document, Types } from 'mongoose';

export interface INotification extends Document {
  institutionId: string;
  userId: Types.ObjectId;
  cycleId?: Types.ObjectId;
  title: string;
  message: string;
  channel: 'IN_APP' | 'EMAIL' | 'SMS';
  isRead: boolean;
  sentAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    institutionId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    cycleId: { type: Schema.Types.ObjectId, ref: 'AllocationCycle' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    channel: { type: String, enum: ['IN_APP', 'EMAIL', 'SMS'], default: 'IN_APP' },
    isRead: { type: Boolean, default: false },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Notification = model<INotification>('Notification', NotificationSchema);
