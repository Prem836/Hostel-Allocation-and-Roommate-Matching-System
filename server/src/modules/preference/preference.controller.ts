import { Request, Response, NextFunction } from 'express';
import { PreferenceService } from './preference.service.js';
import { EligibilityService } from '../eligibility/eligibility.service.js';
import {
  submitPreferencesSchema,
  submitQuestionnaireSchema,
  updateEligibilityPolicySchema,
} from './preference.validation.js';

export class PreferenceController {
  // M3: Eligibility
  static async evaluateCycle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const policyInput = req.body ? updateEligibilityPolicySchema.parse(req.body) : {};
      const result = await EligibilityService.evaluateCycleApplications(req.params.cycleId, policyInput as any);
      res.status(200).json({ success: true, data: result });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        res.status(400).json({ success: false, errors: err.errors });
        return;
      }
      next(err);
    }
  }

  // M4: Preferences
  static async submitPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthenticated' });
        return;
      }
      const parsed = submitPreferencesSchema.parse(req.body);
      const preference = await PreferenceService.submitPreferences(req.params.cycleId, req.user.userId, parsed);
      res.status(200).json({ success: true, data: preference });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        res.status(400).json({ success: false, errors: err.errors });
        return;
      }
      next(err);
    }
  }

  static async getMyPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthenticated' });
        return;
      }
      const preference = await PreferenceService.getStudentPreferences(req.params.cycleId, req.user.userId);
      res.status(200).json({ success: true, data: preference });
    } catch (err) {
      next(err);
    }
  }

  // M5: Questionnaire
  static async submitQuestionnaire(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthenticated' });
        return;
      }
      const parsed = submitQuestionnaireSchema.parse(req.body);
      const result = await PreferenceService.submitQuestionnaire(req.params.cycleId, req.user.userId, parsed);
      res.status(200).json({ success: true, data: result });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        res.status(400).json({ success: false, errors: err.errors });
        return;
      }
      next(err);
    }
  }
}
