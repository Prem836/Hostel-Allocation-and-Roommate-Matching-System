import { z } from 'zod';

export const createCycleSchema = z.object({
  academicYear: z.string().min(4).max(15).trim(), // e.g., "2026-2027"
  semester: z.number().int().min(1).max(8),
  title: z.string().min(3).max(100).trim(),
  windowStart: z.string().datetime(),
  windowEnd: z.string().datetime(),
  randomSeed: z.number().int().optional().default(42),
});

export const updateCycleStatusSchema = z.object({
  status: z.enum(['DRAFT', 'OPEN', 'CLOSED', 'PROCESSING', 'REVIEW', 'PUBLISHED']),
});

export const applyToCycleSchema = z.object({
  cgpa: z.number().min(0.0).max(10.0),
  feeCleared: z.boolean().default(true),
  disciplinaryHold: z.boolean().default(false),
  distanceFromCampusKm: z.number().nonnegative(),
  isAccessibleRequired: z.boolean().default(false),
});

export type CreateCycleInput = z.infer<typeof createCycleSchema>;
export type UpdateCycleStatusInput = z.infer<typeof updateCycleStatusSchema>;
export type ApplyToCycleInput = z.infer<typeof applyToCycleSchema>;
