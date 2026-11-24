import request from 'supertest';
import { createApp } from '../src/app.js';
import { WardenService } from '../src/modules/warden/warden.service.js';

describe('Phase 4 Warden Review & Waitlist Tests', () => {
  const app = createApp();

  describe('Route Guards & Permissions', () => {
    it('GET /api/v1/warden/drafts/:id/floor-map returns 401 without auth', async () => {
      const res = await request(app).get('/api/v1/warden/drafts/507f1f77bcf86cd799439011/floor-map');
      expect(res.status).toBe(401);
    });

    it('POST /api/v1/warden/overrides returns 401 without auth', async () => {
      const res = await request(app).post('/api/v1/warden/overrides').send({
        assignmentId: '507f1f77bcf86cd799439011',
        targetBedId: '507f1f77bcf86cd799439012',
        reason: 'Medical request justification',
      });
      expect(res.status).toBe(401);
    });

    it('PATCH /api/v1/warden/drafts/:id/review returns 401 without auth', async () => {
      const res = await request(app).patch('/api/v1/warden/drafts/507f1f77bcf86cd799439011/review').send({
        status: 'APPROVED',
      });
      expect(res.status).toBe(401);
    });
  });

  describe('Warden Floor Map & Override Mock Operations', () => {
    it('mock getFloorBedMap returns structured room and bed assignments', async () => {
      const mockResult = {
        rooms: [
          {
            roomId: 'r1',
            roomNumber: '101',
            floor: 1,
            roomType: 'DOUBLE',
            capacity: 2,
            isAccessible: true,
            hasAttachedWashroom: false,
            hasAirConditioning: false,
            beds: [
              {
                bedId: 'b1',
                bedLabel: 'A',
                liveStatus: 'VACANT',
                draftAssignment: {
                  assignmentId: 'a1',
                  studentId: 's1',
                  studentName: 'Aarav Sharma',
                  registrationNumber: '2026BCSE01',
                  matchScore: 92,
                  isOverridden: false,
                },
              },
            ],
          },
        ],
        summary: {
          totalRooms: 1,
          totalBeds: 2,
          draftOccupiedBeds: 1,
          vacantDraftBeds: 1,
          overriddenCount: 0,
        },
      };

      jest.spyOn(WardenService, 'getFloorBedMap').mockResolvedValueOnce(mockResult);

      const res = await WardenService.getFloorBedMap('draft_1', 'hostel_1', 1);
      expect(res.summary.totalBeds).toBe(2);
      expect(res.rooms[0].beds[0].draftAssignment?.studentName).toBe('Aarav Sharma');
    });
  });
});
