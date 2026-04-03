import { z } from 'zod';
import { TransactionType } from './transaction.model';

export const createTransactionDto = z.object({
  amount: z.number({ invalid_type_error: 'Amount must be a number' }).positive('Amount must be greater than 0'),
  type: z.nativeEnum(TransactionType),
  category: z.string().min(1, 'Category is required').max(100),
  date: z.string().datetime({ message: 'Date must be a valid ISO 8601 datetime' }).or(z.date()),
  description: z.string().max(500).optional(),
});

export const updateTransactionDto = createTransactionDto.partial();

export const transactionQueryDto = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('20').transform(Number),
  type: z.nativeEnum(TransactionType).optional(),
  category: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type CreateTransactionDto = z.infer<typeof createTransactionDto>;
export type UpdateTransactionDto = z.infer<typeof updateTransactionDto>;
export type TransactionQueryDto = z.infer<typeof transactionQueryDto>;
