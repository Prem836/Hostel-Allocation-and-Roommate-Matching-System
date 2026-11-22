import { Router } from 'express';
import { PreferenceController } from './preference.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();

// M3: Trigger batch eligibility evaluation for a cycle (Admin/Warden)
router.post(
  '/cycles/:cycleId/evaluate-eligibility',
  authenticate,
  authorize('HOSTEL_ADMIN', 'SYSADMIN', 'CHIEF_WARDEN', 'WARDEN'),
  PreferenceController.evaluateCycle
);

// M4: Student preference submission & retrieval
router.post('/cycles/:cycleId/preferences', authenticate, authorize('STUDENT'), PreferenceController.submitPreferences);
router.get('/cycles/:cycleId/my-preferences', authenticate, authorize('STUDENT'), PreferenceController.getMyPreferences);

// M5: Consent-based lifestyle questionnaire submission
router.post('/cycles/:cycleId/questionnaire', authenticate, authorize('STUDENT'), PreferenceController.submitQuestionnaire);

export default router;
