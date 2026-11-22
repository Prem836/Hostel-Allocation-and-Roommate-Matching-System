import request from 'supertest';
import { createApp } from '../src/app.js';
import { EligibilityService } from '../src/modules/eligibility/eligibility.service.js';
import { PreferenceService } from '../src/modules/preference/preference.service.js';

describe('Phase 2 Policy, Preferences & Compatibility Tests', () => {
  const app = createApp();

  describe('Module M3: Eligibility Engine Invariant Rules', () => {
    it('marks student eligible when all criteria are satisfied', () => {
      const application = {
        cgpa: 8.5,
        feeCleared: true,
        disciplinaryHold: false,
        distanceFromCampusKm: 45,
      };

      const result = EligibilityService.evaluateApplication(application);
      expect(result.isEligible).toBe(true);
      expect(result.reasons.length).toBe(0);
    });

    it('rejects student with explicit reason when fee dues exist', () => {
      const application = {
        cgpa: 9.0,
        feeCleared: false,
        disciplinaryHold: false,
        distanceFromCampusKm: 50,
      };

      const result = EligibilityService.evaluateApplication(application);
      expect(result.isEligible).toBe(false);
      expect(result.reasons[0]).toContain('fee dues are outstanding');
    });

    it('rejects student with explicit reason when disciplinary hold exists', () => {
      const application = {
        cgpa: 8.0,
        feeCleared: true,
        disciplinaryHold: true,
        distanceFromCampusKm: 30,
      };

      const result = EligibilityService.evaluateApplication(application);
      expect(result.isEligible).toBe(false);
      expect(result.reasons[0]).toContain('disciplinary action');
    });

    it('rejects student when distance is below threshold', () => {
      const application = {
        cgpa: 7.5,
        feeCleared: true,
        disciplinaryHold: false,
        distanceFromCampusKm: 5, // Below 20km
      };

      const result = EligibilityService.evaluateApplication(application);
      expect(result.isEligible).toBe(false);
      expect(result.reasons[0]).toContain('minimum distance requirement');
    });
  });

  describe('Module M5: Pairwise Compatibility Algorithm', () => {
    it('returns 100% compatibility for identical student habits', () => {
      const studentA = {
        sleepSchedule: 0.8,
        studyHabit: 0.6,
        cleanliness: 0.9,
        noiseTolerance: 0.3,
        smokingTolerance: 0.0,
      };
      const studentB = { ...studentA };

      const score = PreferenceService.calculatePairwiseScore(studentA, studentB);
      expect(score).toBe(100);
    });

    it('returns lower compatibility for diametrically opposite habits', () => {
      const studentA = {
        sleepSchedule: 1.0, // Early bird
        studyHabit: 1.0,    // Library only
        cleanliness: 1.0,   // Extreme tidiness
        noiseTolerance: 0.0,// Total silence
        smokingTolerance: 0.0,
      };
      const studentB = {
        sleepSchedule: 0.0, // Night owl
        studyHabit: 0.0,    // Room studier
        cleanliness: 0.0,   // Relaxed
        noiseTolerance: 1.0,// High noise/parties
        smokingTolerance: 1.0,
      };

      const score = PreferenceService.calculatePairwiseScore(studentA, studentB);
      expect(score).toBe(0);
    });

    it('calculates expected weighted score for intermediate differences', () => {
      const studentA = {
        sleepSchedule: 0.8,
        studyHabit: 0.5,
        cleanliness: 0.8,
        noiseTolerance: 0.5,
        smokingTolerance: 0.0,
      };
      const studentB = {
        sleepSchedule: 0.6, // diff 0.2
        studyHabit: 0.5,    // diff 0
        cleanliness: 0.6,   // diff 0.2
        noiseTolerance: 0.5,// diff 0
        smokingTolerance: 0.0, // diff 0
      };

      const score = PreferenceService.calculatePairwiseScore(studentA, studentB);
      expect(score).toBeGreaterThan(80);
      expect(score).toBeLessThan(100);
    });
  });

  describe('Phase 2 Route Protection & Validation', () => {
    it('POST /api/v1/cycles/:id/preferences returns 401 without auth token', async () => {
      const res = await request(app)
        .post('/api/v1/cycles/507f1f77bcf86cd799439011/preferences')
        .send({
          rankedHostelIds: ['507f1f77bcf86cd799439012'],
          preferredRoomTypes: ['DOUBLE'],
        });
      expect(res.status).toBe(401);
    });

    it('POST /api/v1/cycles/:id/questionnaire returns 401 without auth token', async () => {
      const res = await request(app)
        .post('/api/v1/cycles/507f1f77bcf86cd799439011/questionnaire')
        .send({
          consentGiven: true,
          sleepSchedule: 0.5,
          studyHabit: 0.5,
          cleanliness: 0.5,
          noiseTolerance: 0.5,
          smokingTolerance: 0.5,
        });
      expect(res.status).toBe(401);
    });
  });
});
