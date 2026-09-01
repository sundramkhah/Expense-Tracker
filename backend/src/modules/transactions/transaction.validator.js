import { z } from 'zod';

const fields = {
  type: z.enum(['income', 'expense']),
  amount: z.coerce.number().positive().max(1_000_000_000),
  category: z.string().trim().min(1).max(50),
  description: z.string().trim().max(200).default(''),
  date: z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'Invalid date'),
};

export const createTransactionSchema = z.object(fields);
export const updateTransactionSchema = z.object(fields).partial().refine((value) => Object.keys(value).length > 0, 'Provide at least one field');
