import { z } from 'zod';

export const submitPreferencesSchema = z.object({
  rankedHostelIds: z.array(z.string().min(1)).min(1, 'Please select at least 1 preferred hostel').max(5),
  preferredRoomTypes: z.array(z.enum(['SINGLE', 'DOUBLE', 'TRIPLE', 'DORMITORY'])).min(1),
  requestedRoommateRegNumber: z.string().trim().optional(),
});

export const submitQuestionnaireSchema = z.object({
  consentGiven: z.boolean().refine((val) => val === true, {
    message: 'Explicit consent is mandatory to process lifestyle compatibility data',
  }),
  sleepSchedule: z.number().min(0).max(1), // 0: Night owl, 1: Early bird
  studyHabit: z.number().min(0).max(1),    // 0: Room studier, 1: Library studier
  cleanliness: z.number().min(0).max(1),   // 0: Relaxed, 1: High tidiness
  noiseTolerance: z.number().min(0).max(1),// 0: Low/Silence, 1: High/Social
  smokingTolerance: z.number().min(0).max(1), // 0: Non-smoker only, 1: Flexible
  dietaryPreference: z.string().optional(),
  wakeUpTime: z.string().optional(),
  bedTime: z.string().optional(),
  personalNotes: z.string().max(500).optional(),
});

export const updateEligibilityPolicySchema = z.object({
  minCgpa: z.number().min(0).max(10).optional(),
  requireFeeCleared: z.boolean().optional(),
  disallowDisciplinaryHold: z.boolean().optional(),
  minDistanceKm: z.number().nonnegative().optional(),
});

export type SubmitPreferencesInput = z.infer<typeof submitPreferencesSchema>;
export type SubmitQuestionnaireInput = z.infer<typeof submitQuestionnaireSchema>;
export type UpdateEligibilityPolicyInput = z.infer<typeof updateEligibilityPolicySchema>;
