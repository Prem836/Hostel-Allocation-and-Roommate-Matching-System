import { z } from 'zod';

export const overrideBedAssignmentSchema = z.object({
  assignmentId: z.string().min(1, 'Assignment ID is required'),
  targetBedId: z.string().min(1, 'Target Bed ID is required'),
  reason: z.string().min(10, 'Mandatory written reason required (minimum 10 characters)').trim(),
});

export const promoteWaitlistStudentSchema = z.object({
  waitlistEntryId: z.string().min(1, 'Waitlist Entry ID is required'),
  targetBedId: z.string().min(1, 'Target Bed ID is required'),
  reason: z.string().optional().default('Promoted from waitlist on bed vacancy'),
});

export const updateDraftStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  reviewNotes: z.string().optional(),
});

export type OverrideBedAssignmentInput = z.infer<typeof overrideBedAssignmentSchema>;
export type PromoteWaitlistStudentInput = z.infer<typeof promoteWaitlistStudentSchema>;
export type UpdateDraftStatusInput = z.infer<typeof updateDraftStatusSchema>;
