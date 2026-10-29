import { Schema, model, Document, Types } from 'mongoose';

export type BedStatus = 'VACANT' | 'OCCUPIED' | 'MAINTENANCE';
export type RoomType = 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'DORMITORY';

export interface IHostel extends Document {
  institutionId: string;
  name: string;
  code: string;
  gender: 'MALE' | 'FEMALE' | 'COED';
  totalCapacity: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBlock extends Document {
  institutionId: string;
  hostelId: Types.ObjectId;
  name: string;
  code: string;
  floorsCount: number;
}

export interface IRoom extends Document {
  institutionId: string;
  hostelId: Types.ObjectId;
  blockId: Types.ObjectId;
  roomNumber: string;
  floor: number;
  roomType: RoomType;
  capacity: number;
  isAccessible: boolean; // Ground floor or elevator accessible
  hasAttachedWashroom: boolean;
  hasAirConditioning: boolean;
}

export interface IBed extends Document {
  institutionId: string;
  roomId: Types.ObjectId;
  hostelId: Types.ObjectId;
  bedLabel: string; // e.g., 'A', 'B'
  status: BedStatus;
  currentStudentId?: Types.ObjectId; // Only updated by FINAL PUBLISH action
  notes?: string;
}

const HostelSchema = new Schema<IHostel>(
  {
    institutionId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    gender: { type: String, enum: ['MALE', 'FEMALE', 'COED'], required: true },
    totalCapacity: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const BlockSchema = new Schema<IBlock>(
  {
    institutionId: { type: String, required: true, index: true },
    hostelId: { type: Schema.Types.ObjectId, ref: 'Hostel', required: true, index: true },
    name: { type: String, required: true },
    code: { type: String, required: true, uppercase: true },
    floorsCount: { type: Number, required: true, default: 1 },
  },
  { timestamps: true }
);

const RoomSchema = new Schema<IRoom>(
  {
    institutionId: { type: String, required: true, index: true },
    hostelId: { type: Schema.Types.ObjectId, ref: 'Hostel', required: true, index: true },
    blockId: { type: Schema.Types.ObjectId, ref: 'Block', required: true, index: true },
    roomNumber: { type: String, required: true },
    floor: { type: Number, required: true },
    roomType: { type: String, enum: ['SINGLE', 'DOUBLE', 'TRIPLE', 'DORMITORY'], required: true },
    capacity: { type: Number, required: true },
    isAccessible: { type: Boolean, default: false },
    hasAttachedWashroom: { type: Boolean, default: false },
    hasAirConditioning: { type: Boolean, default: false },
  },
  { timestamps: true }
);
RoomSchema.index({ hostelId: 1, roomNumber: 1 }, { unique: true });

const BedSchema = new Schema<IBed>(
  {
    institutionId: { type: String, required: true, index: true },
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
    hostelId: { type: Schema.Types.ObjectId, ref: 'Hostel', required: true, index: true },
    bedLabel: { type: String, required: true },
    status: { type: String, enum: ['VACANT', 'OCCUPIED', 'MAINTENANCE'], default: 'VACANT', required: true },
    currentStudentId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    notes: { type: String },
  },
  { timestamps: true }
);
BedSchema.index({ roomId: 1, bedLabel: 1 }, { unique: true });

export const Hostel = model<IHostel>('Hostel', HostelSchema);
export const Block = model<IBlock>('Block', BlockSchema);
export const Room = model<IRoom>('Room', RoomSchema);
export const Bed = model<IBed>('Bed', BedSchema);

