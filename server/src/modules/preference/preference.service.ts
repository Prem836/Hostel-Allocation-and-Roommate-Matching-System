import { Types } from 'mongoose';
import { Preference, CompatibilityResponse, IPreference, ICompatibilityResponse } from '../allocation/allocation.model.js';
import { User } from '../auth/user.model.js';
import { Application, AllocationCycle } from '../cycle/cycle.model.js';
import { encryptJSON } from '../../utils/crypto.js';
import { SubmitPreferencesInput, SubmitQuestionnaireInput } from './preference.validation.js';
import { ENV } from '../../config/env.js';

export interface TraitWeights {
  sleepSchedule: number;
  studyHabit: number;
  cleanliness: number;
  noiseTolerance: number;
  smokingTolerance: number;
}

export const DEFAULT_TRAIT_WEIGHTS: TraitWeights = {
  sleepSchedule: 0.25,
  studyHabit: 0.20,
  cleanliness: 0.25,
  noiseTolerance: 0.15,
  smokingTolerance: 0.15,
};

export class PreferenceService {
  // ---- MODULE M4: PREFERENCES ----
  static async submitPreferences(
    cycleId: string,
    studentId: string,
    data: SubmitPreferencesInput
  ): Promise<IPreference> {
    const cycle = await AllocationCycle.findOne({ _id: cycleId, institutionId: ENV.INSTITUTION_ID });
    if (!cycle) throw { status: 404, message: 'Allocation cycle not found' };

    // Check application exists
    const app = await Application.findOne({ cycleId, studentId, institutionId: ENV.INSTITUTION_ID });
    if (!app) {
      throw { status: 400, message: 'You must submit an application for this cycle first' };
    }

    let requestedRoommateId: Types.ObjectId | undefined;
    if (data.requestedRoommateRegNumber) {
      const targetUser = await User.findOne({
        registrationNumber: data.requestedRoommateRegNumber.trim(),
        institutionId: ENV.INSTITUTION_ID,
      });
      if (!targetUser) {
        throw { status: 404, message: `Student with registration number '${data.requestedRoommateRegNumber}' was not found` };
      }
      if (targetUser._id.toString() === studentId) {
        throw { status: 400, message: 'You cannot request yourself as a roommate' };
      }
      requestedRoommateId = targetUser._id as Types.ObjectId;
    }

    const preference = await Preference.findOneAndUpdate(
      { cycleId, studentId, institutionId: ENV.INSTITUTION_ID },
      {
        $set: {
          rankedHostelIds: data.rankedHostelIds.map((id) => new Types.ObjectId(id)),
          preferredRoomTypes: data.preferredRoomTypes,
          requestedRoommateStudentId: requestedRoommateId,
        },
      },
      { upsert: true, new: true }
    );

    return preference;
  }

  static async getStudentPreferences(cycleId: string, studentId: string): Promise<IPreference | null> {
    return await Preference.findOne({ cycleId, studentId, institutionId: ENV.INSTITUTION_ID })
      .populate('rankedHostelIds', 'name code gender')
      .populate('requestedRoommateStudentId', 'fullName registrationNumber');
  }

  // ---- MODULE M5: QUESTIONNAIRE & SCORING ----
  static async submitQuestionnaire(
    cycleId: string,
    studentId: string,
    data: SubmitQuestionnaireInput
  ): Promise<{ success: boolean; message: string }> {
    const app = await Application.findOne({ cycleId, studentId, institutionId: ENV.INSTITUTION_ID });
    if (!app) {
      throw { status: 400, message: 'You must submit an application for this cycle first' };
    }

    // Encrypt sensitive raw answers before persisting
    const rawAnswers = {
      dietaryPreference: data.dietaryPreference,
      wakeUpTime: data.wakeUpTime,
      bedTime: data.bedTime,
      personalNotes: data.personalNotes,
      submittedAt: new Date(),
    };
    const encryptedLifestyle = encryptJSON(rawAnswers);

    const traitVector = {
      sleepSchedule: data.sleepSchedule,
      studyHabit: data.studyHabit,
      cleanliness: data.cleanliness,
      noiseTolerance: data.noiseTolerance,
      smokingTolerance: data.smokingTolerance,
    };

    await CompatibilityResponse.findOneAndUpdate(
      { cycleId, studentId, institutionId: ENV.INSTITUTION_ID },
      {
        $set: {
          consentGiven: true,
          encryptedLifestyle,
          traitVector,
        },
      },
      { upsert: true, new: true }
    );

    return { success: true, message: 'Lifestyle questionnaire submitted and encrypted securely' };
  }

  /**
   * Pairwise Compatibility Scorer:
   * Score = 100 * SUM[ w_k * (1 - |a_k - b_k|) ]
   * Returns a score between 0.0 (incompatible) and 100.0 (identical habits)
   */
  static calculatePairwiseScore(
    traitsA: Record<string, number>,
    traitsB: Record<string, number>,
    weights: TraitWeights = DEFAULT_TRAIT_WEIGHTS
  ): number {
    let weightedSum = 0;
    let totalWeight = 0;

    for (const [key, weight] of Object.entries(weights)) {
      const aVal = traitsA[key] ?? 0.5;
      const bVal = traitsB[key] ?? 0.5;
      const diff = Math.abs(aVal - bVal);
      const similarity = 1 - diff; // 1 = identical, 0 = opposite

      weightedSum += weight * similarity;
      totalWeight += weight;
    }

    if (totalWeight === 0) return 100;
    const finalScore = (weightedSum / totalWeight) * 100;
    return Number(finalScore.toFixed(2));
  }
}
