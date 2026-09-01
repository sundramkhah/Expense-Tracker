import { z } from 'zod';

const fields = {
  category: z.string().trim().min(1).max(50),
  limit: z.coerce.number().positive().max(1_000_000_000),
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must be YYYY-MM'),
};

export const createBudgetSchema = z.object(fields);
export const updateBudgetSchema = z.object(fields).partial().refine((value) => Object.keys(value).length > 0, 'Provide at least one field');
