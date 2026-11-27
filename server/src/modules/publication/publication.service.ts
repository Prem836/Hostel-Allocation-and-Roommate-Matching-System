import mongoose, { Types } from 'mongoose';
import PDFDocument from 'pdfkit';
import crypto from 'crypto';
import {
  AllocationDraft,
  DraftAssignment,
  WaitlistEntry,
  Preference,
  AuditEntry,
  IAllocationDraft,
} from '../allocation/allocation.model.js';
import { AllocationCycle, Application } from '../cycle/cycle.model.js';
import { Bed, Hostel, Room } from '../inventory/inventory.model.js';
import { Notification } from './notification.model.js';
import { ENV } from '../../config/env.js';

export interface PublishResult {
  draftId: string;
  cycleId: string;
  publishedAt: Date;
  bedsUpdated: number;
  notificationsDispatched: number;
}

export class PublicationService {
  /**
   * M9.1: Atomically publishes an APPROVED draft inside a MongoDB multi-document transaction.
   * Governance Rule: A draft MUST be in 'APPROVED' state before it can mutate live Bed.status.
   */
  static async publishDraft(
    draftId: string,
    actorUserId: string,
    notes?: string,
    ipAddress?: string
  ): Promise<PublishResult> {
    const draft = await AllocationDraft.findOne({ _id: draftId, institutionId: ENV.INSTITUTION_ID });
    if (!draft) {
      throw { status: 404, message: 'Allocation draft not found' };
    }

    if (draft.status === 'PUBLISHED') {
      throw { status: 400, message: 'This draft has already been published' };
    }

    if (draft.status !== 'APPROVED') {
      throw {
        status: 403,
        message: `Governance violation: Draft must be APPROVED by a warden before publication (current status: ${draft.status})`,
      };
    }

    const assignments = await DraftAssignment.find({ draftId: draft._id });
    const waitlistEntries = await WaitlistEntry.find({ draftId: draft._id });

    const session = await mongoose.startSession();
    session.startTransaction();

    const publishedAt = new Date();
    const actorObjId = new Types.ObjectId(actorUserId);

    try {
      // 1. Bulk update live Bed occupancy
      if (assignments.length > 0) {
        const bedBulkOps = assignments.map((a) => ({
          updateOne: {
            filter: { _id: a.bedId, institutionId: ENV.INSTITUTION_ID },
            update: {
              $set: {
                status: 'OCCUPIED' as const,
                currentStudentId: a.studentId,
              },
            },
          },
        }));
        await Bed.bulkWrite(bedBulkOps, { session });

        // 2. Update allocated students' Application status
        const allocatedStudentIds = assignments.map((a) => a.studentId);
        await Application.updateMany(
          { cycleId: draft.cycleId, studentId: { $in: allocatedStudentIds } },
          { $set: { status: 'ALLOCATED' } },
          { session }
        );
      }

      // 3. Update waitlisted students' Application status
      if (waitlistEntries.length > 0) {
        const waitlistedStudentIds = waitlistEntries.map((w) => w.studentId);
        await Application.updateMany(
          { cycleId: draft.cycleId, studentId: { $in: waitlistedStudentIds } },
          { $set: { status: 'WAITLISTED' } },
          { session }
        );
      }

      // 4. Mark Draft and Cycle as PUBLISHED
      await AllocationDraft.updateOne(
        { _id: draft._id },
        {
          $set: {
            status: 'PUBLISHED',
            publishedBy: actorObjId,
            publishedAt,
          },
        },
        { session }
      );

      await AllocationCycle.updateOne(
        { _id: draft.cycleId },
        {
          $set: {
            status: 'PUBLISHED',
            publishedBy: actorObjId,
            publishedAt,
          },
        },
        { session }
      );

      // 5. Immutable Audit Log
      await AuditEntry.create(
        [
          {
            institutionId: ENV.INSTITUTION_ID,
            actorId: actorObjId,
            action: 'ALLOCATION_DRAFT_PUBLISHED',
            targetType: 'AllocationDraft',
            targetId: draft._id,
            beforeState: { status: 'APPROVED' },
            afterState: {
              status: 'PUBLISHED',
              bedsUpdated: assignments.length,
              waitlistedCount: waitlistEntries.length,
            },
            reason: notes || 'Final warden/admin publication of hostel allocation',
            ipAddress,
            timestamp: publishedAt,
          },
        ],
        { session }
      );

      // 6. Dispatch In-App Notifications
      const notificationsToCreate = [
        ...assignments.map((a) => ({
          institutionId: ENV.INSTITUTION_ID,
          userId: a.studentId,
          cycleId: draft.cycleId,
          title: 'Hostel Allocation Published',
          message: 'Your hostel room allocation has been finalized. You can now download your official allocation letter.',
          channel: 'IN_APP' as const,
          isRead: false,
          sentAt: publishedAt,
        })),
        ...waitlistEntries.map((w) => ({
          institutionId: ENV.INSTITUTION_ID,
          userId: w.studentId,
          cycleId: draft.cycleId,
          title: 'Hostel Waitlist Update',
          message: `You are currently ranked #${w.rank} on the hostel waiting list. We will notify you automatically if a bed opens.`,
          channel: 'IN_APP' as const,
          isRead: false,
          sentAt: publishedAt,
        })),
      ];

      if (notificationsToCreate.length > 0) {
        await Notification.insertMany(notificationsToCreate, { session });
      }

      await session.commitTransaction();

      return {
        draftId: draft._id.toString(),
        cycleId: draft.cycleId.toString(),
        publishedAt,
        bedsUpdated: assignments.length,
        notificationsDispatched: notificationsToCreate.length,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Retrieves a student's published allocation result (strictly excluding raw roommate questionnaire data).
   */
  static async getStudentResult(cycleId: string, studentId: string): Promise<any> {
    const publishedDraft = await AllocationDraft.findOne({
      cycleId,
      institutionId: ENV.INSTITUTION_ID,
      status: 'PUBLISHED',
    }).sort({ draftNumber: -1, createdAt: -1 });

    if (!publishedDraft) {
      throw { status: 404, message: 'No published allocation exists for this cycle yet' };
    }

    const assignment = await DraftAssignment.findOne({
      draftId: publishedDraft._id,
      studentId,
    })
      .populate('studentId', 'fullName registrationNumber email department yearOfStudy')
      .populate('hostelId', 'name code gender')
      .populate('roomId', 'roomNumber floor roomType isAccessible')
      .populate('bedId', 'bedLabel');

    if (assignment) {
      return {
        status: 'ALLOCATED',
        publishedAt: publishedDraft.publishedAt,
        assignment,
      };
    }

    const waitlist = await WaitlistEntry.findOne({
      draftId: publishedDraft._id,
      studentId,
    });

    if (waitlist) {
      return {
        status: 'WAITLISTED',
        publishedAt: publishedDraft.publishedAt,
        waitlistRank: waitlist.rank,
        waitlistStatus: waitlist.status,
      };
    }

    return {
      status: 'NOT_APPLIED_OR_INELIGIBLE',
      publishedAt: publishedDraft.publishedAt,
    };
  }

  /**
   * M9.2: Generates a downloadable PDF Allocation Letter using PDFKit.
   */
  static async generateAllocationLetterPdf(cycleId: string, studentId: string): Promise<Buffer> {
    const result = await this.getStudentResult(cycleId, studentId);

    if (result.status !== 'ALLOCATED' || !result.assignment) {
      throw { status: 404, message: 'No published bed allocation found for this student' };
    }

    const cycle = await AllocationCycle.findById(cycleId);
    const a = result.assignment;
    const student = a.studentId;
    const hostel = a.hostelId;
    const room = a.roomId;
    const bed = a.bedId;

    const verificationCode = crypto
      .createHash('sha256')
      .update(`${a._id}-${student.registrationNumber}-${cycle?._id}`)
      .digest('hex')
      .slice(0, 12)
      .toUpperCase();

    return await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: Error) => reject(err));

      // Header
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .fillColor('#1e293b')
        .text('HOSTEL ACCOMMODATION ALLOTMENT LETTER', { align: 'center' });

      doc.moveDown(0.5);
      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#475569')
        .text(`Academic Cycle: ${cycle?.title || 'Hostel Allocation'} (${cycle?.academicYear || ''})`, {
          align: 'center',
        });

      doc.moveDown(1.5);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#cbd5e1');
      doc.moveDown(1.5);

      // Student Details
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#0f172a').text('Student Details');
      doc.moveDown(0.4);
      doc.fontSize(10).font('Helvetica').fillColor('#334155');
      doc.text(`Full Name: ${student.fullName}`);
      doc.text(`Registration Number: ${student.registrationNumber}`);
      doc.text(`Email: ${student.email}`);
      if (student.department) doc.text(`Department: ${student.department}`);

      doc.moveDown(1.2);

      // Allocation Details
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#0f172a').text('Assigned Accommodation');
      doc.moveDown(0.4);
      doc.fontSize(10).font('Helvetica').fillColor('#334155');
      doc.text(`Hostel: ${hostel.name} (${hostel.code})`);
      doc.text(`Floor: ${room.floor}`);
      doc.text(`Room Number: ${room.roomNumber} (${room.roomType})`);
      doc.text(`Bed Label: Bed ${bed.bedLabel}`);
      doc.text(`Accessibility Provision: ${room.isAccessible ? 'Yes (Accessible Room)' : 'Standard'}`);
      doc.text(`Compatibility Match Score: ${a.matchScore}%`);

      doc.moveDown(1.5);

      // Instructions
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#0f172a').text('Check-In Instructions');
      doc.moveDown(0.4);
      doc.fontSize(10).font('Helvetica').fillColor('#334155');
      doc.text(
        '1. Present this official allotment letter and your university ID card at the Hostel Warden Office upon arrival.'
      );
      doc.text('2. Complete the physical key handover and inventory check-in within 7 days of semester commencement.');
      doc.text('3. Any room-change requests must be submitted through the official portal.');

      doc.moveDown(2);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#cbd5e1');
      doc.moveDown(0.8);

      // Verification Stamp
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#0f766e')
        .text(`Verification Reference: ${verificationCode}`);
      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#64748b')
        .text(`Published At: ${new Date(result.publishedAt).toISOString()} | Institution: ${ENV.INSTITUTION_ID}`);

      doc.end();
    });
  }

  /**
   * M9.3: Get user's in-app notifications
   */
  static async getUserNotifications(userId: string) {
    return await Notification.find({ userId, institutionId: ENV.INSTITUTION_ID })
      .sort({ sentAt: -1 })
      .limit(50);
  }

  /**
   * M9.4: Admin Occupancy Heatmap grouped by Hostel and Floor
   */
  static async getOccupancyHeatmap(): Promise<any> {
    const [hostels, rooms, beds] = await Promise.all([
      Hostel.find({ institutionId: ENV.INSTITUTION_ID }),
      Room.find({ institutionId: ENV.INSTITUTION_ID }),
      Bed.find({ institutionId: ENV.INSTITUTION_ID }),
    ]);

    const roomFloorMap = new Map<string, { hostelId: string; floor: number }>();
    for (const r of rooms) {
      roomFloorMap.set(r._id.toString(), { hostelId: r.hostelId.toString(), floor: r.floor });
    }

    const heatmap: Record<string, any> = {};
    for (const h of hostels) {
      heatmap[h._id.toString()] = {
        hostelId: h._id.toString(),
        name: h.name,
        code: h.code,
        gender: h.gender,
        totalBeds: 0,
        occupiedBeds: 0,
        vacantBeds: 0,
        maintenanceBeds: 0,
        floors: {} as Record<number, { total: number; occupied: number; vacant: number; maintenance: number }>,
      };
    }

    for (const b of beds) {
      const info = roomFloorMap.get(b.roomId.toString());
      if (!info) continue;
      const hEntry = heatmap[info.hostelId];
      if (!hEntry) continue;

      hEntry.totalBeds++;
      if (!hEntry.floors[info.floor]) {
        hEntry.floors[info.floor] = { total: 0, occupied: 0, vacant: 0, maintenance: 0 };
      }
      hEntry.floors[info.floor].total++;

      if (b.status === 'OCCUPIED') {
        hEntry.occupiedBeds++;
        hEntry.floors[info.floor].occupied++;
      } else if (b.status === 'VACANT') {
        hEntry.vacantBeds++;
        hEntry.floors[info.floor].vacant++;
      } else {
        hEntry.maintenanceBeds++;
        hEntry.floors[info.floor].maintenance++;
      }
    }

    return Object.values(heatmap).map((h: any) => ({
      ...h,
      occupancyPercent: h.totalBeds > 0 ? Number(((h.occupiedBeds / h.totalBeds) * 100).toFixed(1)) : 0,
    }));
  }

  /**
   * M9.5: Preference Satisfaction & Warden Override Analytics for a Cycle
   */
  static async getCycleAnalytics(cycleId: string): Promise<any> {
    const draft = await AllocationDraft.findOne({
      cycleId,
      institutionId: ENV.INSTITUTION_ID,
    }).sort({ draftNumber: -1 });

    if (!draft) {
      throw { status: 404, message: 'No allocation draft found for this cycle' };
    }

    const [assignments, preferences, waitlistCount] = await Promise.all([
      DraftAssignment.find({ draftId: draft._id }),
      Preference.find({ cycleId }),
      WaitlistEntry.countDocuments({ draftId: draft._id }),
    ]);

    const prefMap = new Map<string, string[]>();
    for (const p of preferences) {
      prefMap.set(
        p.studentId.toString(),
        p.rankedHostelIds.map((id) => id.toString())
      );
    }

    let firstChoiceCount = 0;
    let secondChoiceCount = 0;
    let thirdOrLowerChoiceCount = 0;
    let unrankedOrOtherCount = 0;
    let overrideCount = 0;
    let totalMatchScore = 0;
    const overrideReasons: string[] = [];

    for (const a of assignments) {
      totalMatchScore += a.matchScore || 0;
      if (a.isOverridden) {
        overrideCount++;
        if (a.overrideReason) overrideReasons.push(a.overrideReason);
      }

      const ranked = prefMap.get(a.studentId.toString());
      if (!ranked || ranked.length === 0) {
        unrankedOrOtherCount++;
        continue;
      }

      const idx = ranked.indexOf(a.hostelId.toString());
      if (idx === 0) firstChoiceCount++;
      else if (idx === 1) secondChoiceCount++;
      else if (idx >= 2) thirdOrLowerChoiceCount++;
      else unrankedOrOtherCount++;
    }

    const totalAssigned = assignments.length;
    const pct = (val: number) => (totalAssigned > 0 ? Number(((val / totalAssigned) * 100).toFixed(1)) : 0);

    return {
      cycleId,
      draftId: draft._id,
      draftStatus: draft.status,
      totalAssigned,
      waitlistCount,
      averageCompatibilityScore: totalAssigned > 0 ? Number((totalMatchScore / totalAssigned).toFixed(2)) : 0,
      preferenceSatisfaction: {
        firstChoiceCount,
        firstChoicePercent: pct(firstChoiceCount),
        secondChoiceCount,
        secondChoicePercent: pct(secondChoiceCount),
        thirdOrLowerChoiceCount,
        thirdOrLowerChoicePercent: pct(thirdOrLowerChoiceCount),
        unrankedOrOtherCount,
      },
      overrides: {
        count: overrideCount,
        overrideRatePercent: pct(overrideCount),
        reasons: overrideReasons,
      },
    };
  }
}
