import { Router } from 'express';
import { CycleController } from './cycle.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();

// General Cycle Endpoints
router.get('/', CycleController.getCycles);
router.get('/:id', CycleController.getCycleById);

// Admin-Managed Cycles
router.post(
  '/',
  authenticate,
  authorize('HOSTEL_ADMIN', 'SYSADMIN', 'CHIEF_WARDEN'),
  CycleController.createCycle
);
router.patch(
  '/:id/status',
  authenticate,
  authorize('HOSTEL_ADMIN', 'SYSADMIN', 'CHIEF_WARDEN'),
  CycleController.updateStatus
);

// Student Application Intake
router.post('/:id/apply', authenticate, authorize('STUDENT'), CycleController.apply);
router.get('/:id/my-application', authenticate, authorize('STUDENT'), CycleController.getMyApplication);

// Staff Inspection of Applications
router.get(
  '/:id/applications',
  authenticate,
  authorize('WARDEN', 'CHIEF_WARDEN', 'HOSTEL_ADMIN', 'SYSADMIN'),
  CycleController.getApplications
);

export default router;
