import request from 'supertest';
import { createApp } from '../src/app.js';
import { encryptJSON, decryptJSON } from '../src/utils/crypto.js';

describe('Phase 0 Baseline Tests', () => {
  const app = createApp();

  describe('Health and Root Endpoints', () => {
    it('GET /health returns 200 with service status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('hostel-allocation-api');
    });

    it('GET /api/v1 returns API details and module list', async () => {
      const res = await request(app).get('/api/v1');
      expect(res.status).toBe(200);
      expect(res.body.version).toBe('1.0.0');
      expect(Array.isArray(res.body.modules)).toBe(true);
      expect(res.body.modules).toContain('M1-Inventory');
    });
  });

  describe('AES-256-GCM Encryption Utilities', () => {
    it('correctly encrypts and decrypts sensitive lifestyle questionnaire payload', () => {
      const sampleQuestionnaire = {
        sleepSchedule: 0.8,
        studyHabit: 0.5,
        cleanliness: 0.9,
        noiseTolerance: 0.2,
        smokingTolerance: 0.0,
        personalNotes: 'Strictly quiet after 11 PM',
      };

      const encrypted = encryptJSON(sampleQuestionnaire);
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('ciphertext');
      expect(encrypted).toHaveProperty('tag');

      const decrypted = decryptJSON<typeof sampleQuestionnaire>(encrypted);
      expect(decrypted).toEqual(sampleQuestionnaire);
    });
  });

  describe('Auth Route Validation', () => {
    it('POST /api/v1/auth/register rejects invalid email or missing fields with 400', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          registrationNumber: 'ST123',
          email: 'not-an-email',
          password: 'short',
          fullName: 'Test Student',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation failed');
    });

    it('POST /api/v1/auth/login rejects empty payload with 400', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/v1/auth/me returns 401 when no token is supplied', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
