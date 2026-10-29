import { Schema, model, Document } from 'mongoose';

export type UserRole = 'STUDENT' | 'WARDEN' | 'CHIEF_WARDEN' | 'HOSTEL_ADMIN' | 'SYSADMIN';

export interface IUser extends Document {
  institutionId: string;
  registrationNumber: string;
  email: string;
  passwordHash: string;
  fullName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  role: UserRole;
  assignedHostelId?: Schema.Types.ObjectId; // For wardens assigned to a specific hostel
  isAccessibleNeed?: boolean; // Requires ground-floor / accessible room
  department?: string;
  yearOfStudy?: number;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    institutionId: { type: String, required: true, default: 'inst_default_01', index: true },
    registrationNumber: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true, trim: true },
    gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'], required: true },
    role: {
      type: String,
      enum: ['STUDENT', 'WARDEN', 'CHIEF_WARDEN', 'HOSTEL_ADMIN', 'SYSADMIN'],
      default: 'STUDENT',
      required: true,
    },
    assignedHostelId: { type: Schema.Types.ObjectId, ref: 'Hostel' },
    isAccessibleNeed: { type: Boolean, default: false },
    department: { type: String },
    yearOfStudy: { type: Number },
    phone: { type: String },
  },
  { timestamps: true }
);

export const User = model<IUser>('User', UserSchema);

