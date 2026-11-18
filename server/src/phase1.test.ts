import request from 'supertest';
import { createApp } from '../src/app.js';
import { InventoryService } from '../src/modules/inventory/inventory.service.js';
import { CycleService } from '../src/modules/cycle/cycle.service.js';

describe('Phase 1 Integration & Route Guards', () => {
  const app = createApp();

  describe('Module M1: Inventory Routes & Guards', () => {
    it('GET /api/v1/inventory/stats returns 200 with stats data', async () => {
      jest.spyOn(InventoryService, 'getInventoryStats').mockResolvedValueOnce({
        totalHostels: 2,
        totalRooms: 10,
        totalBeds: 20,
        vacantBeds: 15,
        occupiedBeds: 5,
        maintenanceBeds: 0,
        occupancyRatePercent: 25.0,
      });

      const res = await request(app).get('/api/v1/inventory/stats');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalBeds).toBe(20);
    });

    it('GET /api/v1/inventory/hostels returns 200 with list of hostels', async () => {
      jest.spyOn(InventoryService, 'getHostels').mockResolvedValueOnce([
        { name: 'APJ Kalam Hall', code: 'BH-1', gender: 'MALE', totalCapacity: 200 } as any,
      ]);

      const res = await request(app).get('/api/v1/inventory/hostels');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
    });

    it('POST /api/v1/inventory/hostels returns 401 when no token is present', async () => {
      const res = await request(app)
        .post('/api/v1/inventory/hostels')
        .send({ name: 'Gandhi Hall', code: 'GH-A', gender: 'MALE' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/v1/inventory/rooms returns 401 when no token is present', async () => {
      const res = await request(app)
        .post('/api/v1/inventory/rooms')
        .send({
          hostelId: '507f1f77bcf86cd799439011',
          blockId: '507f1f77bcf86cd799439012',
          roomNumber: '101',
          floor: 1,
          roomType: 'DOUBLE',
          capacity: 2,
        });
      expect(res.status).toBe(401);
    });
  });

  describe('Module M2: Cycle & Application Intake Protection', () => {
    it('GET /api/v1/cycles returns 200 with active cycles', async () => {
      jest.spyOn(CycleService, 'getCycles').mockResolvedValueOnce([
        {
          title: 'Fall 2026 Allocation',
          academicYear: '2026-2027',
          semester: 1,
          status: 'OPEN',
        } as any,
      ]);

      const res = await request(app).get('/api/v1/cycles');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].title).toBe('Fall 2026 Allocation');
    });

    it('POST /api/v1/cycles returns 401 without auth', async () => {
      const res = await request(app)
        .post('/api/v1/cycles')
        .send({
          academicYear: '2026-2027',
          semester: 1,
          title: 'Fall 2026 Allocation',
          windowStart: '2026-08-01T00:00:00.000Z',
          windowEnd: '2026-08-15T23:59:59.000Z',
        });
      expect(res.status).toBe(401);
    });

    it('POST /api/v1/cycles/:id/apply returns 401 for unauthenticated students', async () => {
      const res = await request(app)
        .post('/api/v1/cycles/507f1f77bcf86cd799439011/apply')
        .send({
          cgpa: 8.5,
          feeCleared: true,
          disciplinaryHold: false,
          distanceFromCampusKm: 120,
        });
      expect(res.status).toBe(401);
    });
  });
});
