import { z } from 'zod';

/**
 * Zod schemas for request body validation.
 */

export const CreateTaskItemSchema = z.object({
  dayId: z.number({ required_error: 'dayId is required' }).int().positive(),
  title: z.string({ required_error: 'Title is required' }).min(1, 'Title is required and cannot be empty').transform((s) => s.trim()),
  category: z.enum(['learn', 'build'], { required_error: "Category must be 'learn' or 'build'" }),
  timeEstimate: z.number().positive('Time estimate must be a positive number').optional().nullable(),
  note: z.string().max(500, 'Note must be 500 characters or fewer').optional().nullable(),
  resourceUrl: z.string().url('Resource URL must be a valid URL').optional().nullable(),
  priority: z.enum(['easy', 'medium', 'hard']).optional().nullable(),
});

export const UpdateTaskItemSchema = z.object({
  isComplete: z.boolean().optional(),
  title: z.string().min(1, 'Title is required and cannot be empty').transform((s) => s.trim()).optional(),
  timeEstimate: z.number().positive('Time estimate must be a positive number').optional().nullable(),
  note: z.string().max(500, 'Note must be 500 characters or fewer').optional().nullable(),
  resourceUrl: z.string().url('Resource URL must be a valid URL').optional().nullable(),
  priority: z.enum(['easy', 'medium', 'hard']).optional().nullable(),
  actualMinutes: z.number().int().min(0).optional().nullable(),
});

export const UpdateDaySchema = z.object({
  isComplete: z.boolean().optional(),
  learnComplete: z.boolean().optional(),
  buildComplete: z.boolean().optional(),
  skipped: z.boolean().optional(),
  confidence: z.number().int().min(1).max(5).optional(),
});

export const SaveNoteSchema = z.object({
  weekId: z.number().int().positive().optional(),
  dayId: z.number().int().positive().optional(),
  content: z.string({ required_error: 'Content is required' }),
});

export const CreateBookmarkSchema = z.object({
  url: z.string({ required_error: 'URL is required' }).url('Must be a valid URL'),
  label: z.string().optional(),
  weekId: z.number().int().positive().optional(),
  tagId: z.number().int().positive().optional(),
});

export type CreateTaskItemInput = z.infer<typeof CreateTaskItemSchema>;
export type UpdateTaskItemInput = z.infer<typeof UpdateTaskItemSchema>;
export type UpdateDayInput = z.infer<typeof UpdateDaySchema>;
export type SaveNoteInput = z.infer<typeof SaveNoteSchema>;
export type CreateBookmarkInput = z.infer<typeof CreateBookmarkSchema>;
