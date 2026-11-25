import { z } from 'zod';

export const publishDraftSchema = z.object({
  notes: z.string().max(500).optional(),
});

export type PublishDraftInput = z.infer<typeof publishDraftSchema>;
