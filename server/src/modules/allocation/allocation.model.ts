import { Schema, model, Document, Types } from 'mongoose';
import { EncryptedData } from '../../utils/crypto.js';

export interface IPreference extends Document {
  institutionId: string;
  cycleId: Types.ObjectId;
  studentId: Types.ObjectId;
  rankedHostelIds: Types.ObjectId[]; // 1st choice, 2nd choice...
  preferredRoomTypes: ('SINGLE' | 'DOUBLE' | 'TRIPLE' | 'DORMITORY')[];
  requestedRoommateStudentId?: Types.ObjectId; // Optional mutual roommate request
}

export interface ICompatibilityResponse extends Document {
  institutionId: string;
  cycleId: Types.ObjectId;
  studentId: Types.ObjectId;
  consentGiven: boolean;
  // Encrypted at rest to adhere to DPDP and project security rules
  encryptedLifestyle: EncryptedData;
  // Normalized vector scores (0.0 to 1.0) stored for computing compatibility matrix efficiently
  traitVector: {
    sleepSchedule: number;  // 0.0 (night owl) to 1.0 (early bird)
    studyHabit: number;     // 0.0 (room studying) to 1.0 (library studying)
    cleanliness: number;    // 0.0 (relaxed) to 1.0 (very tidy)
    noiseTolerance: number; // 0.0 (pin-drop silence) to 1.0 (ambient music/social)
    smokingTolerance: number; // 0.0 (strictly non-smoking) to 1.0 (flexible)
  };
}

export interface IAllocationDraft extends Document {
  institutionId: string;
  cycleId: Types.ObjectId;
  draftNumber: number;
  seed: number;
  status: 'DRAFT' | 'APPROVED' | 'REJECTED' | 'PUBLISHED';
  totalAssigned: number;
  totalWaitlisted: number;
  generatedAt: Date;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  publishedBy?: Types.ObjectId;
  publishedAt?: Date;
}

export interface IDraftAssignment extends Document {
  institutionId: string;
  draftId: Types.ObjectId;
  cycleId: Types.ObjectId;
  studentId: Types.ObjectId;
  hostelId: Types.ObjectId;
  roomId: Types.ObjectId;
  bedId: Types.ObjectId;
  matchScore: number;
  isOverridden: boolean;
  overrideReason?: string;
  overriddenBy?: Types.ObjectId;
  overriddenAt?: Date;
}

export interface IWaitlistEntry extends Document {
  institutionId: string;
  cycleId: Types.ObjectId;
  draftId: Types.ObjectId;
  studentId: Types.ObjectId;
  rank: number;
  priorityScore: number;
  status: 'WAITING' | 'OFFERED' | 'ACCEPTED' | 'DECLINED';
  promotedToBedId?: Types.ObjectId;
}

export interface IAuditEntry extends Document {
  institutionId: string;
  actorId: Types.ObjectId;
  action: string;
  targetType: string;
  targetId: Types.ObjectId | string;
  beforeState?: Record<string, any>;
  afterState?: Record<string, any>;
  reason?: string;
  ipAddress?: string;
  timestamp: Date;
}

const PreferenceSchema = new Schema<IPreference>(
  {
    institutionId: { type: String, required: true, index: true },
    cycleId: { type: Schema.Types.ObjectId, ref: 'AllocationCycle', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rankedHostelIds: [{ type: Schema.Types.ObjectId, ref: 'Hostel' }],
    preferredRoomTypes: [{ type: String, enum: ['SINGLE', 'DOUBLE', 'TRIPLE', 'DORMITORY'] }],
    requestedRoommateStudentId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);
PreferenceSchema.index({ cycleId: 1, studentId: 1 }, { unique: true });

const CompatibilityResponseSchema = new Schema<ICompatibilityResponse>(
  {
    institutionId: { type: String, required: true, index: true },
    cycleId: { type: Schema.Types.ObjectId, ref: 'AllocationCycle', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    consentGiven: { type: Boolean, required: true, default: true },
    encryptedLifestyle: {
      iv: { type: String, required: true },
      ciphertext: { type: String, required: true },
      tag: { type: String, required: true },
    },
    traitVector: {
      sleepSchedule: { type: Number, required: true, min: 0, max: 1 },
      studyHabit: { type: Number, required: true, min: 0, max: 1 },
      cleanliness: { type: Number, required: true, min: 0, max: 1 },
      noiseTolerance: { type: Number, required: true, min: 0, max: 1 },
      smokingTolerance: { type: Number, required: true, min: 0, max: 1 },
    },
  },
  { timestamps: true }
);
CompatibilityResponseSchema.index({ cycleId: 1, studentId: 1 }, { unique: true });

const AllocationDraftSchema = new Schema<IAllocationDraft>(
  {
    institutionId: { type: String, required: true, index: true },
    cycleId: { type: Schema.Types.ObjectId, ref: 'AllocationCycle', required: true, index: true },
    draftNumber: { type: Number, required: true, default: 1 },
    seed: { type: Number, required: true },
    status: { type: String, enum: ['DRAFT', 'APPROVED', 'REJECTED', 'PUBLISHED'], default: 'DRAFT', required: true },
    totalAssigned: { type: Number, default: 0 },
    totalWaitlisted: { type: Number, default: 0 },
    generatedAt: { type: Date, default: Date.now },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    publishedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

const DraftAssignmentSchema = new Schema<IDraftAssignment>(
  {
    institutionId: { type: String, required: true, index: true },
    draftId: { type: Schema.Types.ObjectId, ref: 'AllocationDraft', required: true, index: true },
    cycleId: { type: Schema.Types.ObjectId, ref: 'AllocationCycle', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    hostelId: { type: Schema.Types.ObjectId, ref: 'Hostel', required: true },
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    bedId: { type: Schema.Types.ObjectId, ref: 'Bed', required: true },
    matchScore: { type: Number, default: 100 },
    isOverridden: { type: Boolean, default: false },
    overrideReason: { type: String },
    overriddenBy: { type: Schema.Types.ObjectId, ref: 'User' },
    overriddenAt: { type: Date },
  },
  { timestamps: true }
);

// Guarantee in a draft that no bed or student is double-assigned
DraftAssignmentSchema.index({ draftId: 1, bedId: 1 }, { unique: true });
DraftAssignmentSchema.index({ draftId: 1, studentId: 1 }, { unique: true });

const WaitlistEntrySchema = new Schema<IWaitlistEntry>(
  {
    institutionId: { type: String, required: true, index: true },
    cycleId: { type: Schema.Types.ObjectId, ref: 'AllocationCycle', required: true, index: true },
    draftId: { type: Schema.Types.ObjectId, ref: 'AllocationDraft', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rank: { type: Number, required: true },
    priorityScore: { type: Number, required: true },
    status: { type: String, enum: ['WAITING', 'OFFERED', 'ACCEPTED', 'DECLINED'], default: 'WAITING' },
    promotedToBedId: { type: Schema.Types.ObjectId, ref: 'Bed' },
  },
  { timestamps: true }
);
WaitlistEntrySchema.index({ draftId: 1, rank: 1 }, { unique: true });

const AuditEntrySchema = new Schema<IAuditEntry>(
  {
    institutionId: { type: String, required: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, required: true },
    targetType: { type: String, required: true },
    targetId: { type: Schema.Types.Mixed, required: true },
    beforeState: { type: Schema.Types.Mixed },
    afterState: { type: Schema.Types.Mixed },
    reason: { type: String },
    ipAddress: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export const Preference = model<IPreference>('Preference', PreferenceSchema);
export const CompatibilityResponse = model<ICompatibilityResponse>('CompatibilityResponse', CompatibilityResponseSchema);
export const AllocationDraft = model<IAllocationDraft>('AllocationDraft', AllocationDraftSchema);
export const DraftAssignment = model<IDraftAssignment>('DraftAssignment', DraftAssignmentSchema);
export const WaitlistEntry = model<IWaitlistEntry>('WaitlistEntry', WaitlistEntrySchema);
export const AuditEntry = model<IAuditEntry>('AuditEntry', AuditEntrySchema);

