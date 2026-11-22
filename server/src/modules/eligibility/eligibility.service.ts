import { Types } from 'mongoose';
import { Application, AllocationCycle, IApplication } from '../cycle/cycle.model.js';
import { ENV } from '../../config/env.js';

export interface EligibilityPolicy {
  minCgpa: number;
  requireFeeCleared: boolean;
  disallowDisciplinaryHold: boolean;
  minDistanceKm: number;
}

export const DEFAULT_ELIGIBILITY_POLICY: EligibilityPolicy = {
  minCgpa: 5.0,
  requireFeeCleared: true,
  disallowDisciplinaryHold: true,
  minDistanceKm: 20, // Must live at least 20km away from campus to qualify
};

export class EligibilityService {
  /**
   * Deterministically evaluates an application against policy rules and returns
   * a boolean decision along with structured, human-readable explanations.
   */
  static evaluateApplication(
    app: {
      cgpa: number;
      feeCleared: boolean;
      disciplinaryHold: boolean;
      distanceFromCampusKm: number;
    },
    policy: EligibilityPolicy = DEFAULT_ELIGIBILITY_POLICY
  ): { isEligible: boolean; reasons: string[] } {
    const reasons: string[] = [];

    if (policy.requireFeeCleared && !app.feeCleared) {
      reasons.push('Institutional or tuition fee dues are outstanding for the current semester');
    }

    if (policy.disallowDisciplinaryHold && app.disciplinaryHold) {
      reasons.push('Active disciplinary action on student record prevents hostel allocation');
    }

    if (app.cgpa < policy.minCgpa) {
      reasons.push(`Cumulative GPA (${app.cgpa.toFixed(2)}) is below the required threshold of ${policy.minCgpa.toFixed(2)}`);
    }

    if (app.distanceFromCampusKm < policy.minDistanceKm) {
      reasons.push(
        `Residential address (${app.distanceFromCampusKm} km) does not meet the minimum distance requirement of ${policy.minDistanceKm} km`
      );
    }

    return {
      isEligible: reasons.length === 0,
      reasons,
    };
  }

  /**
   * Evaluates and updates all SUBMITTED applications for an allocation cycle in batch.
   */
  static async evaluateCycleApplications(
    cycleId: string,
    policy: EligibilityPolicy = DEFAULT_ELIGIBILITY_POLICY
  ): Promise<{ evaluated: number; eligible: number; ineligible: number }> {
    const applications = await Application.find({
      cycleId,
      institutionId: ENV.INSTITUTION_ID,
    });

    let eligible = 0;
    let ineligible = 0;

    for (const app of applications) {
      const evaluation = this.evaluateApplication(app, policy);
      app.status = evaluation.isEligible ? 'ELIGIBLE' : 'INELIGIBLE';
      app.ineligibilityReasons = evaluation.reasons;
      await app.save();

      if (evaluation.isEligible) {
        eligible++;
      } else {
        ineligible++;
      }
    }

    return {
      evaluated: applications.length,
      eligible,
      ineligible,
    };
  }
}
