import { Types } from 'mongoose';
import {
  AllocationDraft,
  DraftAssignment,
  WaitlistEntry,
  AuditEntry,
  IDraftAssignment,
  IWaitlistEntry,
} from '../allocation/allocation.model.js';
import { Bed, Room, Hostel } from '../inventory/inventory.model.js';
import {
  OverrideBedAssignmentInput,
  PromoteWaitlistStudentInput,
  UpdateDraftStatusInput,
} from './warden.validation.js';
import { ENV } from '../../config/env.js';

export interface FloorBedMapRoom {
  roomId: string;
  roomNumber: string;
  floor: number;
  roomType: string;
  capacity: number;
  isAccessible: boolean;
  hasAttachedWashroom: boolean;
  hasAirConditioning: boolean;
  beds: {
    bedId: string;
    bedLabel: string;
    liveStatus: string;
    draftAssignment?: {
      assignmentId: string;
      studentId: string;
      studentName: string;
      registrationNumber: string;
      matchScore: number;
      isOverridden: boolean;
      overrideReason?: string;
    };
  }[];
}

export class WardenService {
  /**
   * M7: Fetches the visual floor bed map for a specific hostel and floor
   * joining rooms, beds, and their current draft placement.
   */
  static async getFloorBedMap(
    draftId: string,
    hostelId: string,
    floor: number
  ): Promise<{ rooms: FloorBedMapRoom[]; summary: any }> {
    const draft = await AllocationDraft.findOne({ _id: draftId, institutionId: ENV.INSTITUTION_ID });
    if (!draft) throw { status: 404, message: 'Allocation draft not found' };

    const rooms = await Room.find({
      hostelId: new Types.ObjectId(hostelId),
      floor,
      institutionId: ENV.INSTITUTION_ID,
    }).sort({ roomNumber: 1 });

    const roomIds = rooms.map((r) => r._id);
    const [allBeds, assignments] = await Promise.all([
      Bed.find({ roomId: { $in: roomIds }, institutionId: ENV.INSTITUTION_ID }).sort({ bedLabel: 1 }),
      DraftAssignment.find({ draftId: draft._id, roomId: { $in: roomIds } }).populate(
        'studentId',
        'fullName registrationNumber gender isAccessibleNeed'
      ),
    ]);

    const assignmentMap = new Map<string, any>();
    for (const a of assignments) {
      assignmentMap.set(a.bedId.toString(), a);
    }

    const bedsByRoom = new Map<string, any[]>();
    for (const b of allBeds) {
      const rId = b.roomId.toString();
      if (!bedsByRoom.has(rId)) bedsByRoom.set(rId, []);

      const assign = assignmentMap.get(b._id.toString());
      bedsByRoom.get(rId)!.push({
        bedId: b._id.toString(),
        bedLabel: b.bedLabel,
        liveStatus: b.status,
        draftAssignment: assign
          ? {
              assignmentId: assign._id.toString(),
              studentId: assign.studentId._id.toString(),
              studentName: assign.studentId.fullName,
              registrationNumber: assign.studentId.registrationNumber,
              matchScore: assign.matchScore,
              isOverridden: assign.isOverridden,
              overrideReason: assign.overrideReason,
            }
          : undefined,
      });
    }

    const mappedRooms: FloorBedMapRoom[] = rooms.map((r) => ({
      roomId: r._id.toString(),
      roomNumber: r.roomNumber,
      floor: r.floor,
      roomType: r.roomType,
      capacity: r.capacity,
      isAccessible: r.isAccessible,
      hasAttachedWashroom: r.hasAttachedWashroom,
      hasAirConditioning: r.hasAirConditioning,
      beds: bedsByRoom.get(r._id.toString()) || [],
    }));

    const totalBeds = allBeds.length;
    const occupiedDraftBeds = assignments.length;
    const overriddenCount = assignments.filter((a) => a.isOverridden).length;

    return {
      rooms: mappedRooms,
      summary: {
        totalRooms: rooms.length,
        totalBeds,
        draftOccupiedBeds: occupiedDraftBeds,
        vacantDraftBeds: totalBeds - occupiedDraftBeds,
        overriddenCount,
      },
    };
  }

  /**
   * M7: Manual bed reassignment with MANDATORY written reason and audit log.
   */
  static async overrideAssignment(
    wardenUserId: string,
    data: OverrideBedAssignmentInput,
    ipAddress?: string
  ): Promise<IDraftAssignment> {
    const assignment = await DraftAssignment.findById(data.assignmentId);
    if (!assignment) throw { status: 404, message: 'Draft assignment record not found' };

    const draft = await AllocationDraft.findById(assignment.draftId);
    if (!draft || draft.status === 'PUBLISHED') {
      throw { status: 400, message: 'Cannot modify assignments on a published draft' };
    }

    // Target bed verification
    const targetBed = await Bed.findById(data.targetBedId);
    if (!targetBed) throw { status: 404, message: 'Target bed not found' };

    const targetRoom = await Room.findById(targetBed.roomId);
    if (!targetRoom) throw { status: 404, message: 'Target room not found' };

    // Check if target bed is already assigned in this draft
    const existingConflict = await DraftAssignment.findOne({
      draftId: assignment.draftId,
      bedId: targetBed._id,
      _id: { $ne: assignment._id },
    });
    if (existingConflict) {
      throw { status: 409, message: 'Target bed is already assigned to another student in this draft' };
    }

    const beforeState = {
      hostelId: assignment.hostelId,
      roomId: assignment.roomId,
      bedId: assignment.bedId,
      isOverridden: assignment.isOverridden,
    };

    // Apply override
    assignment.hostelId = targetRoom.hostelId;
    assignment.roomId = targetRoom._id as Types.ObjectId;
    assignment.bedId = targetBed._id as Types.ObjectId;
    assignment.isOverridden = true;
    assignment.overrideReason = data.reason;
    assignment.overriddenBy = new Types.ObjectId(wardenUserId);
    assignment.overriddenAt = new Date();
    await assignment.save();

    // Log to immutable AuditEntry
    await AuditEntry.create({
      institutionId: ENV.INSTITUTION_ID,
      actorId: new Types.ObjectId(wardenUserId),
      action: 'WARDEN_OVERRIDE_REASSIGNMENT',
      targetType: 'DraftAssignment',
      targetId: assignment._id,
      beforeState,
      afterState: {
        hostelId: assignment.hostelId,
        roomId: assignment.roomId,
        bedId: assignment.bedId,
        isOverridden: true,
        reason: data.reason,
      },
      reason: data.reason,
      ipAddress,
      timestamp: new Date(),
    });

    return assignment;
  }

  /**
   * M8: Waitlist Management - Auto-promotion of highest ranked waiting student
   * into a vacant bed.
   */
  static async promoteNextWaitlistStudent(
    cycleId: string,
    draftId: string,
    targetBedId: string,
    actorUserId: string,
    reason?: string
  ): Promise<{ assignment: IDraftAssignment; waitlistEntry: IWaitlistEntry }> {
    const draft = await AllocationDraft.findById(draftId);
    if (!draft || draft.status === 'PUBLISHED') {
      throw { status: 400, message: 'Cannot promote into an invalid or published draft' };
    }

    const bed = await Bed.findById(targetBedId);
    if (!bed) throw { status: 404, message: 'Bed not found' };
    const room = await Room.findById(bed.roomId);
    if (!room) throw { status: 404, message: 'Room not found' };

    // Verify bed not occupied in draft
    const conflict = await DraftAssignment.findOne({ draftId, bedId: bed._id });
    if (conflict) throw { status: 409, message: 'Target bed is already occupied in this draft' };

    // Find highest ranked student in waitlist
    const nextWaitlisted = await WaitlistEntry.findOne({
      draftId,
      status: 'WAITING',
    }).sort({ rank: 1 });

    if (!nextWaitlisted) {
      throw { status: 404, message: 'No students currently waiting on the waitlist for this draft' };
    }

    // Create Draft Assignment
    const assignment = await DraftAssignment.create({
      institutionId: ENV.INSTITUTION_ID,
      draftId: draft._id,
      cycleId: new Types.ObjectId(cycleId),
      studentId: nextWaitlisted.studentId,
      hostelId: room.hostelId,
      roomId: room._id,
      bedId: bed._id,
      matchScore: 80,
      isOverridden: true,
      overrideReason: reason || 'Waitlist promotion upon bed vacancy',
      overriddenBy: new Types.ObjectId(actorUserId),
      overriddenAt: new Date(),
    });

    // Update waitlist entry status
    nextWaitlisted.status = 'OFFERED';
    nextWaitlisted.promotedToBedId = bed._id as Types.ObjectId;
    await nextWaitlisted.save();

    // Increment draft assignment count and decrement waitlist
    await AllocationDraft.findByIdAndUpdate(draft._id, {
      $inc: { totalAssigned: 1, totalWaitlisted: -1 },
    });

    // Audit log
    await AuditEntry.create({
      institutionId: ENV.INSTITUTION_ID,
      actorId: new Types.ObjectId(actorUserId),
      action: 'WAITLIST_AUTO_PROMOTION',
      targetType: 'WaitlistEntry',
      targetId: nextWaitlisted._id,
      afterState: { promotedToBedId: bed._id, studentId: nextWaitlisted.studentId },
      reason: reason || 'Promoted from waitlist',
      timestamp: new Date(),
    });

    return { assignment, waitlistEntry: nextWaitlisted };
  }

  /**
   * M7: Warden Draft Approval / Rejection
   */
  static async reviewDraft(
    draftId: string,
    wardenUserId: string,
    data: UpdateDraftStatusInput
  ): Promise<any> {
    const draft = await AllocationDraft.findById(draftId);
    if (!draft) throw { status: 404, message: 'Draft not found' };
    if (draft.status === 'PUBLISHED') {
      throw { status: 400, message: 'Draft is already published' };
    }

    draft.status = data.status;
    draft.approvedBy = new Types.ObjectId(wardenUserId);
    draft.approvedAt = new Date();
    await draft.save();

    await AuditEntry.create({
      institutionId: ENV.INSTITUTION_ID,
      actorId: new Types.ObjectId(wardenUserId),
      action: `WARDEN_DRAFT_${data.status}`,
      targetType: 'AllocationDraft',
      targetId: draft._id,
      reason: data.reviewNotes || `Draft marked as ${data.status}`,
      timestamp: new Date(),
    });

    return draft;
  }
}
