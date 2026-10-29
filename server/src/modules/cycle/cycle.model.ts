import { Schema, model, Document, Types } from 'mongoose';

export type CycleStatus = 'DRAFT' | 'OPEN' | 'CLOSED' | 'PROCESSING' | 'REVIEW' | 'PUBLISHED';
export type ApplicationStatus = 'SUBMITTED' | 'ELIGIBLE' | 'INELIGIBLE' | 'ALLOCATED' | 'WAITLISTED' | 'REJECTED';

export interface IAllocationCycle extends Document {
  institutionId: string;
  academicYear: string; // e.g. "2026-2027"
  semester: number; // 1, 2, ...
  title: string;
  windowStart: Date;
  windowEnd: Date;
  status: CycleStatus;
  randomSeed: number; // Seed for deterministic tiebreak
  totalApplicantsCount: number;
  allocatedCount: number;
  waitlistedCount: number;
  publishedAt?: Date;
  publishedBy?: Types.ObjectId;
}

export interface IApplication extends Document {
  institutionId: string;
  cycleId: Types.ObjectId;
  studentId: Types.ObjectId;
  status: ApplicationStatus;
  cgpa: number;
  feeCleared: boolean;
  disciplinaryHold: boolean;
  distanceFromCampusKm: number;
  isAccessibleRequired: boolean;
  ineligibilityReasons: string[];
  submittedAt: Date;
}

const AllocationCycleSchema = new Schema<IAllocationCycle>(
  {
    institutionId: { type: String, required: true, index: true },
    academicYear: { type: String, required: true },
    semester: { type: Number, required: true },
    title: { type: String, required: true },
    windowStart: { type: Date, required: true },
    windowEnd: { type: Date, required: true },
    status: {
      type: String,
      enum: ['DRAFT', 'OPEN', 'CLOSED', 'PROCESSING', 'REVIEW', 'PUBLISHED'],
      default: 'DRAFT',
    },
    randomSeed: { type: Number, default: 42 },
    totalApplicantsCount: { type: Number, default: 0 },
    allocatedCount: { type: Number, default: 0 },
    waitlistedCount: { type: Number, default: 0 },
    publishedAt: { type: Date },
    publishedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const ApplicationSchema = new Schema<IApplication>(
  {
    institutionId: { type: String, required: true, index: true },
    cycleId: { type: Schema.Types.ObjectId, ref: 'AllocationCycle', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: {
      type: String,
      enum: ['SUBMITTED', 'ELIGIBLE', 'INELIGIBLE', 'ALLOCATED', 'WAITLISTED', 'REJECTED'],
      default: 'SUBMITTED',
    },
    cgpa: { type: Number, default: 0.0 },
    feeCleared: { type: Boolean, default: true },
    disciplinaryHold: { type: Boolean, default: false },
    distanceFromCampusKm: { type: Number, default: 0 },
    isAccessibleRequired: { type: Boolean, default: false },
    ineligibilityReasons: [{ type: String }],
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// One application per student per cycle
ApplicationSchema.index({ cycleId: 1, studentId: 1 }, { unique: true });

export const AllocationCycle = model<IAllocationCycle>('AllocationCycle', AllocationCycleSchema);
export const Application = model<IApplication>('Application', ApplicationSchema);

