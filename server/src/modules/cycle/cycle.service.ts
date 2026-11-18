import { Types } from 'mongoose';
import { AllocationCycle, Application, IAllocationCycle, IApplication, CycleStatus } from './cycle.model.js';
import { CreateCycleInput, ApplyToCycleInput } from './cycle.validation.js';
import { ENV } from '../../config/env.js';

export class CycleService {
  // ---- ALLOCATION CYCLES ----
  static async createCycle(data: CreateCycleInput): Promise<IAllocationCycle> {
    const start = new Date(data.windowStart);
    const end = new Date(data.windowEnd);

    if (end <= start) {
      throw { status: 400, message: 'windowEnd must be after windowStart' };
    }

    return await AllocationCycle.create({
      institutionId: ENV.INSTITUTION_ID,
      academicYear: data.academicYear,
      semester: data.semester,
      title: data.title,
      windowStart: start,
      windowEnd: end,
      randomSeed: data.randomSeed ?? 42,
      status: 'DRAFT',
    });
  }

  static async getCycles(status?: CycleStatus): Promise<IAllocationCycle[]> {
    const query: any = { institutionId: ENV.INSTITUTION_ID };
    if (status) query.status = status;
    return await AllocationCycle.find(query).sort({ createdAt: -1 });
  }

  static async getCycleById(id: string): Promise<IAllocationCycle> {
    const cycle = await AllocationCycle.findOne({ _id: id, institutionId: ENV.INSTITUTION_ID });
    if (!cycle) throw { status: 404, message: 'Allocation cycle not found' };
    return cycle;
  }

  static async updateCycleStatus(id: string, status: CycleStatus): Promise<IAllocationCycle> {
    const cycle = await AllocationCycle.findOneAndUpdate(
      { _id: id, institutionId: ENV.INSTITUTION_ID },
      { $set: { status } },
      { new: true }
    );
    if (!cycle) throw { status: 404, message: 'Allocation cycle not found' };
    return cycle;
  }

  // ---- STUDENT APPLICATION INTAKE ----
  static async submitApplication(
    cycleId: string,
    studentId: string,
    data: ApplyToCycleInput
  ): Promise<IApplication> {
    const cycle = await this.getCycleById(cycleId);

    // Rule: cycle must be OPEN
    const now = new Date();
    if (cycle.status !== 'OPEN' || now < cycle.windowStart || now > cycle.windowEnd) {
      throw { status: 400, message: 'Application window for this cycle is currently closed' };
    }

    // Rule: check if application already exists
    const existing = await Application.findOne({
      cycleId: cycle._id,
      studentId: new Types.ObjectId(studentId),
    });
    if (existing) {
      throw { status: 409, message: 'You have already submitted an application for this cycle' };
    }

    // Determine initial eligibility & collect explainable reasons
    const ineligibilityReasons: string[] = [];
    if (!data.feeCleared) {
      ineligibilityReasons.push('Pending institutional or academic fee dues');
    }
    if (data.disciplinaryHold) {
      ineligibilityReasons.push('Active disciplinary hold on record');
    }

    const status = ineligibilityReasons.length > 0 ? 'INELIGIBLE' : 'SUBMITTED';

    const application = await Application.create({
      institutionId: ENV.INSTITUTION_ID,
      cycleId: cycle._id,
      studentId: new Types.ObjectId(studentId),
      status,
      cgpa: data.cgpa,
      feeCleared: data.feeCleared,
      disciplinaryHold: data.disciplinaryHold,
      distanceFromCampusKm: data.distanceFromCampusKm,
      isAccessibleRequired: data.isAccessibleRequired,
      ineligibilityReasons,
      submittedAt: now,
    });

    // Update applicant count
    await AllocationCycle.findByIdAndUpdate(cycle._id, { $inc: { totalApplicantsCount: 1 } });

    return application;
  }

  static async getStudentApplication(cycleId: string, studentId: string): Promise<IApplication | null> {
    return await Application.findOne({
      cycleId,
      studentId,
      institutionId: ENV.INSTITUTION_ID,
    }).populate('cycleId', 'title academicYear semester status windowStart windowEnd');
  }

  static async getApplicationsForCycle(cycleId: string, status?: string): Promise<IApplication[]> {
    const query: any = { cycleId, institutionId: ENV.INSTITUTION_ID };
    if (status) query.status = status;
    return await Application.find(query)
      .populate('studentId', 'fullName registrationNumber email gender department yearOfStudy')
      .sort({ submittedAt: 1 });
  }
}
