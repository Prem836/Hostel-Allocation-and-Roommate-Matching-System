import { Router } from 'express';
import { InventoryController } from './inventory.controller.js';
import { InventoryService } from './inventory.service.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();

// Public / Authenticated read routes
router.get('/stats', InventoryController.getStats);
router.get('/hostels', InventoryController.getHostels);
router.post('/seed', async (req, res) => {
  try {
    await InventoryService.seedDefaultInventory();
    const hostels = await InventoryService.getHostels();
    res.json({ success: true, message: 'Seeded default campus hostels', data: hostels });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});
router.get('/hostels/:id', InventoryController.getHostelById);
router.get('/hostels/:hostelId/blocks', InventoryController.getBlocksByHostel);
router.get('/rooms', InventoryController.getRooms);
router.get('/rooms/:id', InventoryController.getRoomDetails);

// Admin & Warden Management Routes
router.post(
  '/hostels',
  authenticate,
  authorize('HOSTEL_ADMIN', 'SYSADMIN', 'CHIEF_WARDEN'),
  InventoryController.createHostel
);
router.put(
  '/hostels/:id',
  authenticate,
  authorize('HOSTEL_ADMIN', 'SYSADMIN', 'CHIEF_WARDEN'),
  InventoryController.updateHostel
);
router.post(
  '/blocks',
  authenticate,
  authorize('HOSTEL_ADMIN', 'SYSADMIN', 'CHIEF_WARDEN'),
  InventoryController.createBlock
);
router.post(
  '/rooms',
  authenticate,
  authorize('HOSTEL_ADMIN', 'SYSADMIN', 'CHIEF_WARDEN'),
  InventoryController.createRoom
);
router.post(
  '/rooms/bulk-import',
  authenticate,
  authorize('HOSTEL_ADMIN', 'SYSADMIN'),
  InventoryController.bulkImport
);
router.patch(
  '/beds/:id/status',
  authenticate,
  authorize('WARDEN', 'CHIEF_WARDEN', 'HOSTEL_ADMIN', 'SYSADMIN'),
  InventoryController.updateBedStatus
);

export default router;
