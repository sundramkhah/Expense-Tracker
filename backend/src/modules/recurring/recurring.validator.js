import { z } from 'zod';

const fields = {
  type: z.enum(['income', 'expense']),
  amount: z.coerce.number().positive().max(1_000_000_000),
  category: z.string().trim().min(1).max(50),
  description: z.string().trim().max(200).default(''),
  frequency: z.enum(['weekly', 'monthly', 'yearly']),
  nextDate: z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'Invalid date'),
  active: z.boolean().default(true),
};

export const createRecurringSchema = z.object(fields);
export const updateRecurringSchema = z.object(fields).partial().refine((value) => Object.keys(value).length > 0, 'Provide at least one field');
