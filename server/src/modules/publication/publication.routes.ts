import { Router } from 'express';
import { PublicationController } from './publication.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();

// M9.1: Publish approved draft atomically (Warden / Chief Warden / Admin)
router.post(
  '/drafts/:draftId/publish',
  authenticate,
  authorize('WARDEN', 'CHIEF_WARDEN', 'HOSTEL_ADMIN', 'SYSADMIN'),
  PublicationController.publishDraft
);

// Student: View published allocation result & download PDF letter
router.get(
  '/cycles/:cycleId/my-result',
  authenticate,
  authorize('STUDENT'),
  PublicationController.getMyResult
);

router.get(
  '/cycles/:cycleId/my-letter',
  authenticate,
  authorize('STUDENT'),
  PublicationController.downloadAllocationLetter
);

// M9.3: In-app notifications
router.get('/notifications', authenticate, PublicationController.getMyNotifications);

// M9.4 & M9.5: Admin / Dean / Warden Analytics
router.get(
  '/analytics/occupancy',
  authenticate,
  authorize('WARDEN', 'CHIEF_WARDEN', 'HOSTEL_ADMIN', 'SYSADMIN'),
  PublicationController.getOccupancyHeatmap
);

router.get(
  '/analytics/cycles/:cycleId',
  authenticate,
  authorize('WARDEN', 'CHIEF_WARDEN', 'HOSTEL_ADMIN', 'SYSADMIN'),
  PublicationController.getCycleAnalytics
);

export default router;
