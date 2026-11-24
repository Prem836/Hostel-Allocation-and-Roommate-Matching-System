import { Router } from 'express';
import { WardenController } from './warden.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();

// Floor Bed Map for Draft Visual Inspection
router.get(
  '/drafts/:draftId/floor-map',
  authenticate,
  authorize('WARDEN', 'CHIEF_WARDEN', 'HOSTEL_ADMIN', 'SYSADMIN'),
  WardenController.getFloorBedMap
);

// Manual Bed Override with Reason
router.post(
  '/overrides',
  authenticate,
  authorize('WARDEN', 'CHIEF_WARDEN', 'HOSTEL_ADMIN', 'SYSADMIN'),
  WardenController.overrideAssignment
);

// Promote Student from Waitlist to Bed
router.post(
  '/drafts/:draftId/promote-waitlist',
  authenticate,
  authorize('WARDEN', 'CHIEF_WARDEN', 'HOSTEL_ADMIN', 'SYSADMIN'),
  WardenController.promoteWaitlist
);

// Approve or Reject Draft
router.patch(
  '/drafts/:draftId/review',
  authenticate,
  authorize('WARDEN', 'CHIEF_WARDEN', 'HOSTEL_ADMIN', 'SYSADMIN'),
  WardenController.reviewDraft
);

export default router;
