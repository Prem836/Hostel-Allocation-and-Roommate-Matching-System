import { Router } from 'express';
import { AllocationController } from './allocation.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();

// Trigger allocation run for a closed/ready cycle
router.post(
  '/cycles/:cycleId/allocate',
  authenticate,
  authorize('HOSTEL_ADMIN', 'SYSADMIN', 'CHIEF_WARDEN', 'WARDEN'),
  AllocationController.triggerAllocation
);

// Inspect draft allocations & assignments
router.get(
  '/drafts/:draftId',
  authenticate,
  authorize('WARDEN', 'CHIEF_WARDEN', 'HOSTEL_ADMIN', 'SYSADMIN'),
  AllocationController.getDraft
);

export default router;
