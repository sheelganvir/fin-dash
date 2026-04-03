import { TransactionRepository } from './transaction.repository';
import { NotFoundError } from '../../common/errors/HttpErrors';
import type { CreateTransactionDto, UpdateTransactionDto, TransactionQueryDto } from './transaction.dto';

const transactionRepository = new TransactionRepository();

export async function createTransaction(dto: CreateTransactionDto, userId: string) {
  return transactionRepository.create(dto, userId);
}

export async function getTransactions(query: TransactionQueryDto) {
  return transactionRepository.findAll(query);
}

export async function getTransactionById(id: string) {
  const transaction = await transactionRepository.findById(id);
  if (!transaction) throw new NotFoundError('Transaction not found');
  return transaction;
}

export async function updateTransaction(id: string, dto: UpdateTransactionDto) {
  const transaction = await transactionRepository.update(id, dto);
  if (!transaction) throw new NotFoundError('Transaction not found');
  return transaction;
}

export async function deleteTransaction(id: string) {
  const transaction = await transactionRepository.softDelete(id);
  if (!transaction) throw new NotFoundError('Transaction not found');
  return { message: 'Transaction deleted successfully' };
}
