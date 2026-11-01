import { z } from 'zod';

export const registerSchema = z.object({
  registrationNumber: z.string().min(3).max(30).trim(),
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  fullName: z.string().min(2).max(100).trim(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  role: z.enum(['STUDENT', 'WARDEN', 'CHIEF_WARDEN', 'HOSTEL_ADMIN', 'SYSADMIN']).optional().default('STUDENT'),
  isAccessibleNeed: z.boolean().optional().default(false),
  department: z.string().optional(),
  yearOfStudy: z.number().int().min(1).max(6).optional(),
  phone: z.string().optional(),
  assignedHostelId: z.string().optional(),
});

export const loginSchema = z.object({
  emailOrReg: z.string().min(1, 'Email or Registration Number is required').trim(),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
