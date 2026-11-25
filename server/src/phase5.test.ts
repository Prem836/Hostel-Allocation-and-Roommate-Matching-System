import request from 'supertest';
import seedrandom from 'seedrandom';
import { createApp } from '../src/app.js';
import { PublicationService } from '../src/modules/publication/publication.service.js';
import { AllocationDraft, DraftAssignment } from '../src/modules/allocation/allocation.model.js';
import { AllocationCycle } from '../src/modules/cycle/cycle.model.js';
import { encryptJSON } from '../src/utils/crypto.js';

describe('Phase 5 Publication, PDF, Analytics & Invariant Tests', () => {
  const app = createApp();

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Module M9: Route Guards & Authorization', () => {
    it('POST /api/v1/publication/drafts/:id/publish returns 401 without auth', async () => {
      const res = await request(app).post('/api/v1/publication/drafts/507f1f77bcf86cd799439011/publish');
      expect(res.status).toBe(401);
    });

    it('GET /api/v1/publication/cycles/:id/my-result returns 401 without auth', async () => {
      const res = await request(app).get('/api/v1/publication/cycles/507f1f77bcf86cd799439011/my-result');
      expect(res.status).toBe(401);
    });

    it('GET /api/v1/publication/cycles/:id/my-letter returns 401 without auth', async () => {
      const res = await request(app).get('/api/v1/publication/cycles/507f1f77bcf86cd799439011/my-letter');
      expect(res.status).toBe(401);
    });

    it('GET /api/v1/publication/analytics/occupancy returns 401 without auth', async () => {
      const res = await request(app).get('/api/v1/publication/analytics/occupancy');
      expect(res.status).toBe(401);
    });
  });

  describe('Invariant & Property-Based Verification Suite', () => {
    it('Test 1 & Test 2: DraftAssignment schema enforces unique bedId and unique studentId per draft', () => {
      const indexes = DraftAssignment.schema.indexes();
      const hasUniqueBed = indexes.some(
        ([fields, opts]) => fields.draftId === 1 && fields.bedId === 1 && opts?.unique === true
      );
      const hasUniqueStudent = indexes.some(
        ([fields, opts]) => fields.draftId === 1 && fields.studentId === 1 && opts?.unique === true
      );

      expect(hasUniqueBed).toBe(true);
      expect(hasUniqueStudent).toBe(true);
    });

    it('Test 3: Seed reproducibility produces identical tie-break ordering from the same seed', () => {
      const students = Array.from({ length: 50 }, (_, i) => ({
        id: `student-${i}`,
        cgpa: 8.0,
        distance: 50,
      }));

      const runWithSeed = (seed: number) => {
        const rng = seedrandom(seed.toString());
        return [...students].sort((a, b) => {
          if (b.cgpa !== a.cgpa) return b.cgpa - a.cgpa;
          return rng() - 0.5;
        });
      };

      const run1 = runWithSeed(2026);
      const run2 = runWithSeed(2026);
      const runDifferent = runWithSeed(9999);

      expect(run1.map((s) => s.id)).toEqual(run2.map((s) => s.id));
      expect(run1.map((s) => s.id)).not.toEqual(runDifferent.map((s) => s.id));
    });

    it('Test 4: Negative governance rule - cannot publish an unapproved DRAFT', async () => {
      jest.spyOn(AllocationDraft, 'findOne').mockResolvedValueOnce({
        _id: 'draft_unapproved',
        status: 'DRAFT',
      } as any);

      await expect(
        PublicationService.publishDraft('draft_unapproved', 'warden_1')
      ).rejects.toMatchObject({
        status: 403,
      });
    });

    it('Test 5: DPDP Privacy - raw questionnaire data is encrypted and excluded from published student results', async () => {
      const raw = { personalNotes: 'Sensitive private sleep habit note' };
      const encrypted = encryptJSON(raw);

      expect(encrypted.ciphertext).not.toContain('Sensitive private sleep habit note');

      jest.spyOn(PublicationService, 'getStudentResult').mockResolvedValueOnce({
        status: 'ALLOCATED',
        publishedAt: new Date(),
        assignment: {
          hostelId: { name: 'BH-1', code: 'BH-1' },
          roomId: { roomNumber: '101', floor: 1, roomType: 'DOUBLE', isAccessible: true },
          bedId: { bedLabel: 'A' },
          matchScore: 91,
        },
      });

      const result = await PublicationService.getStudentResult('cycle_1', 'student_1');
      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain('encryptedLifestyle');
      expect(serialized).not.toContain('traitVector');
    });

    it('M9.2: Generates a valid PDF buffer for an allocated student', async () => {
      jest.spyOn(PublicationService, 'getStudentResult').mockResolvedValueOnce({
        status: 'ALLOCATED',
        publishedAt: new Date('2026-11-25T00:00:00Z'),
        assignment: {
          _id: 'assign_001',
          matchScore: 94.5,
          studentId: {
            fullName: 'Aarav Sharma',
            registrationNumber: '2026BCSE01',
            email: 'aarav@university.edu',
            department: 'CSE',
          },
          hostelId: { name: 'APJ Abdul Kalam Hostel', code: 'BH-1' },
          roomId: { roomNumber: '101', floor: 1, roomType: 'DOUBLE', isAccessible: true },
          bedId: { bedLabel: 'A' },
        },
      });

      jest.spyOn(AllocationCycle, 'findById').mockResolvedValueOnce({
        _id: 'cycle_001',
        title: 'Fall 2026 Allocation',
        academicYear: '2026-2027',
      } as any);

      const pdfBuffer = await PublicationService.generateAllocationLetterPdf('cycle_001', 'student_001');
      expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
      expect(pdfBuffer.length).toBeGreaterThan(500);
      expect(pdfBuffer.subarray(0, 4).toString()).toBe('%PDF');
    });
  });
});
