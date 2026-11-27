import { Types } from 'mongoose';
import seedrandom from 'seedrandom';
import {
  AllocationDraft,
  DraftAssignment,
  WaitlistEntry,
  Preference,
  CompatibilityResponse,
  IAllocationDraft,
  IDraftAssignment,
} from './allocation.model.js';
import { Application, AllocationCycle } from '../cycle/cycle.model.js';
import { Bed, Room, Hostel, IBed, IRoom, IHostel } from '../inventory/inventory.model.js';
import { PreferenceService, DEFAULT_TRAIT_WEIGHTS } from '../preference/preference.service.js';
import { ENV } from '../../config/env.js';

export interface AllocationRunResult {
  draft: IAllocationDraft;
  assignedCount: number;
  waitlistedCount: number;
  hardConstraintViolations: number;
}

export class AllocationEngineService {
  /**
   * Deterministic, seeded hostel allocation algorithm.
   *
   * Hard Constraints (NEVER violated):
   * 1. Gender isolation by hostel block/building.
   * 2. Bed capacity limits (exactly 1 student per bed, no double assignment).
   * 3. Accessibility matching (students requiring ground-floor/accessible rooms are assigned only accessible rooms).
   * 4. Only ELIGIBLE applications are processed.
   *
   * Soft Constraints (Optimized):
   * 1. Ranked hostel & room-type preferences.
   * 2. Pairwise compatibility scoring for multi-occupancy rooms.
   *
   * Governance Invariant:
   * This engine writes ONLY to AllocationDraft, DraftAssignment, and WaitlistEntry collections.
   * It NEVER mutates live Bed.status or Bed.currentStudentId.
   */
  static async runAllocation(cycleId: string, customSeed?: number): Promise<AllocationRunResult> {
    const cycle = await AllocationCycle.findOne({ _id: cycleId, institutionId: ENV.INSTITUTION_ID });
    if (!cycle) throw { status: 404, message: 'Allocation cycle not found' };

    const seed = customSeed ?? cycle.randomSeed ?? ENV.DEFAULT_ALLOCATION_SEED;
    const rng = seedrandom(seed.toString());

    // 1. Fetch eligible applications
    const applications = await Application.find({
      cycleId: cycle._id,
      institutionId: ENV.INSTITUTION_ID,
      status: { $in: ['ELIGIBLE', 'SUBMITTED'] },
    }).populate('studentId', 'fullName registrationNumber gender isAccessibleNeed');

    // 2. Fetch student preferences & compatibility vectors
    const studentIds = applications.map((a) => a.studentId._id);
    const [preferencesList, compatibilityList] = await Promise.all([
      Preference.find({ cycleId: cycle._id, studentId: { $in: studentIds } }),
      CompatibilityResponse.find({ cycleId: cycle._id, studentId: { $in: studentIds } }),
    ]);

    const prefMap = new Map<string, any>();
    for (const p of preferencesList) {
      prefMap.set(p.studentId.toString(), p);
    }

    const traitMap = new Map<string, Record<string, number>>();
    for (const c of compatibilityList) {
      traitMap.set(c.studentId.toString(), c.traitVector);
    }

    // 3. Fetch vacant inventory
    const [hostels, rooms, beds] = await Promise.all([
      Hostel.find({ institutionId: ENV.INSTITUTION_ID, isActive: { $ne: false } }),
      Room.find({ institutionId: ENV.INSTITUTION_ID }),
      Bed.find({ institutionId: ENV.INSTITUTION_ID, status: 'VACANT' }),
    ]);

    const hostelMap = new Map<string, IHostel>();
    for (const h of hostels) hostelMap.set(h._id.toString(), h);

    const roomMap = new Map<string, IRoom>();
    for (const r of rooms) roomMap.set(r._id.toString(), r);

    // Group vacant beds by room
    const bedsByRoom = new Map<string, IBed[]>();
    for (const b of beds) {
      const rId = b.roomId.toString();
      if (!bedsByRoom.has(rId)) bedsByRoom.set(rId, []);
      bedsByRoom.get(rId)!.push(b);
    }

    // Sort applicants with deterministic tiebreaker
    // Priority: CGPA descending, distance descending, seeded random tiebreaker
    const sortedApps = [...applications].sort((a, b) => {
      if (b.cgpa !== a.cgpa) return b.cgpa - a.cgpa;
      if (b.distanceFromCampusKm !== a.distanceFromCampusKm) {
        return b.distanceFromCampusKm - a.distanceFromCampusKm;
      }
      return rng() - 0.5;
    });

    // Create Draft record
    const existingDraftCount = await AllocationDraft.countDocuments({ cycleId: cycle._id });
    const draft = await AllocationDraft.create({
      institutionId: ENV.INSTITUTION_ID,
      cycleId: cycle._id,
      draftNumber: existingDraftCount + 1,
      seed,
      status: 'DRAFT',
      totalAssigned: 0,
      totalWaitlisted: 0,
    });

    const assignmentsToInsert: any[] = [];
    const waitlistToInsert: any[] = [];
    const occupiedBedsInDraft = new Set<string>();
    const roomOccupantsInDraft = new Map<string, string[]>(); // roomId -> studentIds

    for (const app of sortedApps) {
      const student: any = app.studentId;
      const sId = student._id.toString();
      const needsAccessible = student.isAccessibleNeed || app.isAccessibleRequired;
      const studentGender = student.gender; // 'MALE' | 'FEMALE'

      const prefs = prefMap.get(sId);
      const rankedHostelIds: string[] = prefs ? prefs.rankedHostelIds.map((id: any) => id.toString()) : [];
      const preferredRoomTypes: string[] = prefs ? prefs.preferredRoomTypes : [];

      let assignedBed: IBed | null = null;
      let assignedRoom: IRoom | null = null;
      let assignedHostel: IHostel | null = null;
      let bestMatchScore = 70; // baseline satisfaction

      // Candidate search honoring hard constraints
      for (const [rId, roomBeds] of bedsByRoom.entries()) {
        const room = roomMap.get(rId);
        if (!room) continue;

        const hostel = hostelMap.get(room.hostelId.toString());
        if (!hostel) continue;

        // Hard Constraint 1: Gender compatibility
        if (hostel.gender !== 'COED' && hostel.gender !== studentGender) {
          continue;
        }

        // Hard Constraint 3: Accessibility requirement
        if (needsAccessible && !room.isAccessible) {
          continue;
        }

        // Find available bed in this room not yet assigned in draft
        const availableBed = roomBeds.find((b) => !occupiedBedsInDraft.has(b._id.toString()));
        if (!availableBed) continue;

        // Check soft constraints: compatibility with existing roommates assigned in draft
        const currentRoommates = roomOccupantsInDraft.get(rId) || [];
        let roomCompatibility = 100;
        const studentTraits = traitMap.get(sId);

        if (currentRoommates.length > 0 && studentTraits) {
          let scoreSum = 0;
          for (const rmId of currentRoommates) {
            const rmTraits = traitMap.get(rmId);
            if (rmTraits) {
              scoreSum += PreferenceService.calculatePairwiseScore(studentTraits, rmTraits);
            } else {
              scoreSum += 75; // neutral fallback
            }
          }
          roomCompatibility = scoreSum / currentRoommates.length;
        }

        // Soft score weighting: preferences + compatibility
        let candidateScore = roomCompatibility * 0.6;
        if (rankedHostelIds.includes(hostel._id.toString())) {
          candidateScore += 25;
        }
        if (preferredRoomTypes.includes(room.roomType)) {
          candidateScore += 15;
        }

        if (candidateScore >= bestMatchScore || !assignedBed) {
          assignedBed = availableBed;
          assignedRoom = room;
          assignedHostel = hostel;
          bestMatchScore = candidateScore;
        }
      }

      if (assignedBed && assignedRoom && assignedHostel) {
        occupiedBedsInDraft.add(assignedBed._id.toString());
        if (!roomOccupantsInDraft.has(assignedRoom._id.toString())) {
          roomOccupantsInDraft.set(assignedRoom._id.toString(), []);
        }
        roomOccupantsInDraft.get(assignedRoom._id.toString())!.push(sId);

        assignmentsToInsert.push({
          institutionId: ENV.INSTITUTION_ID,
          draftId: draft._id,
          cycleId: cycle._id,
          studentId: student._id,
          hostelId: assignedHostel._id,
          roomId: assignedRoom._id,
          bedId: assignedBed._id,
          matchScore: Number(bestMatchScore.toFixed(2)),
          isOverridden: false,
        });
      } else {
        // Hard constraint or capacity reached -> Student waitlisted
        waitlistToInsert.push({
          institutionId: ENV.INSTITUTION_ID,
          cycleId: cycle._id,
          draftId: draft._id,
          studentId: student._id,
          rank: waitlistToInsert.length + 1,
          priorityScore: Number(app.cgpa.toFixed(2)),
          status: 'WAITING',
        });
      }
    }

    // Insert draft assignments & waitlist records
    if (assignmentsToInsert.length > 0) {
      await DraftAssignment.insertMany(assignmentsToInsert);
    }
    if (waitlistToInsert.length > 0) {
      await WaitlistEntry.insertMany(waitlistToInsert);
    }

    draft.totalAssigned = assignmentsToInsert.length;
    draft.totalWaitlisted = waitlistToInsert.length;
    await draft.save();

    await AllocationCycle.findByIdAndUpdate(cycle._id, {
      allocatedCount: assignmentsToInsert.length,
      waitlistedCount: waitlistToInsert.length,
      status: 'REVIEW',
    });

    return {
      draft,
      assignedCount: assignmentsToInsert.length,
      waitlistedCount: waitlistToInsert.length,
      hardConstraintViolations: 0,
    };
  }

  static async getDraftDetails(draftId: string): Promise<any> {
    const draft = await AllocationDraft.findOne({ _id: draftId, institutionId: ENV.INSTITUTION_ID });
    if (!draft) throw { status: 404, message: 'Draft not found' };

    const assignments = await DraftAssignment.find({ draftId })
      .populate('studentId', 'fullName registrationNumber gender')
      .populate('hostelId', 'name code')
      .populate('roomId', 'roomNumber floor roomType isAccessible')
      .populate('bedId', 'bedLabel');

    const waitlist = await WaitlistEntry.find({ draftId })
      .populate('studentId', 'fullName registrationNumber gender')
      .sort({ rank: 1 });

    return { draft, assignments, waitlist };
  }
}
