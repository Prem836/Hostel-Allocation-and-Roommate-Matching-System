import { z } from 'zod';

export const createHostelSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  code: z.string().min(1).max(20).trim().toUpperCase(),
  gender: z.enum(['MALE', 'FEMALE', 'COED']),
  totalCapacity: z.number().int().nonnegative().optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export const updateHostelSchema = createHostelSchema.partial();

export const createBlockSchema = z.object({
  hostelId: z.string().min(1, 'Hostel ID is required'),
  name: z.string().min(1).max(100).trim(),
  code: z.string().min(1).max(20).trim().toUpperCase(),
  floorsCount: z.number().int().positive().default(1),
});

export const createRoomSchema = z.object({
  hostelId: z.string().min(1, 'Hostel ID is required'),
  blockId: z.string().min(1, 'Block ID is required'),
  roomNumber: z.string().min(1).max(20).trim(),
  floor: z.number().int().min(0),
  roomType: z.enum(['SINGLE', 'DOUBLE', 'TRIPLE', 'DORMITORY']),
  capacity: z.number().int().positive(),
  isAccessible: z.boolean().optional().default(false),
  hasAttachedWashroom: z.boolean().optional().default(false),
  hasAirConditioning: z.boolean().optional().default(false),
  createBedsAutomatically: z.boolean().optional().default(true),
});

export const updateRoomSchema = createRoomSchema.partial();

export const updateBedStatusSchema = z.object({
  status: z.enum(['VACANT', 'OCCUPIED', 'MAINTENANCE']),
  notes: z.string().optional(),
});

export const bulkImportRoomsSchema = z.object({
  hostelId: z.string().min(1, 'Hostel ID is required'),
  blockId: z.string().min(1, 'Block ID is required'),
  rooms: z.array(
    z.object({
      roomNumber: z.string().min(1).trim(),
      floor: z.number().int().min(0),
      roomType: z.enum(['SINGLE', 'DOUBLE', 'TRIPLE', 'DORMITORY']),
      capacity: z.number().int().positive(),
      isAccessible: z.boolean().optional().default(false),
      hasAttachedWashroom: z.boolean().optional().default(false),
      hasAirConditioning: z.boolean().optional().default(false),
    })
  ).min(1, 'At least one room is required for bulk import'),
});

export type CreateHostelInput = z.infer<typeof createHostelSchema>;
export type UpdateHostelInput = z.infer<typeof updateHostelSchema>;
export type CreateBlockInput = z.infer<typeof createBlockSchema>;
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
export type UpdateBedStatusInput = z.infer<typeof updateBedStatusSchema>;
export type BulkImportRoomsInput = z.infer<typeof bulkImportRoomsSchema>;
