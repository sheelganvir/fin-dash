import { PipelineStage } from 'mongoose';
import { TransactionRepository } from '../transactions/transaction.repository';

const transactionRepository = new TransactionRepository();

interface SummaryResult {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
}

interface CategoryBreakdown {
  category: string;
  type: string;
  total: number;
  count: number;
}

interface MonthlyTrend {
  year: number;
  month: number;
  income: number;
  expense: number;
  net: number;
}

export async function getSummary(): Promise<SummaryResult> {
  const pipeline: PipelineStage[] = [
    { $match: { deletedAt: null } },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
      },
    },
  ];

  const results = await transactionRepository.aggregate<{ _id: string; total: number }>(pipeline);

  let totalIncome = 0;
  let totalExpense = 0;

  for (const r of results) {
    if (r._id === 'INCOME') totalIncome = r.total;
    if (r._id === 'EXPENSE') totalExpense = r.total;
  }

  return {
    totalIncome,
    totalExpense,
    netBalance: totalIncome - totalExpense,
  };
}

export async function getCategoryBreakdown(): Promise<CategoryBreakdown[]> {
  const pipeline: PipelineStage[] = [
    { $match: { deletedAt: null } },
    {
      $group: {
        _id: { category: '$category', type: '$type' },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.type': 1, total: -1 } },
    {
      $project: {
        _id: 0,
        category: '$_id.category',
        type: '$_id.type',
        total: 1,
        count: 1,
      },
    },
  ];

  return transactionRepository.aggregate<CategoryBreakdown>(pipeline);
}

export async function getMonthlyTrends(year: number): Promise<MonthlyTrend[]> {
  const pipeline: PipelineStage[] = [
    {
      $match: {
        deletedAt: null,
        $expr: { $eq: [{ $year: '$date' }, year] },
      },
    },
    {
      $group: {
        _id: { year: { $year: '$date' }, month: { $month: '$date' }, type: '$type' },
        total: { $sum: '$amount' },
      },
    },
    { $sort: { '_id.month': 1 } },
  ];

  type RawTrend = { _id: { year: number; month: number; type: string }; total: number };
  const raw = await transactionRepository.aggregate<RawTrend>(pipeline);

  // Merge INCOME and EXPENSE into single month objects
  const monthMap = new Map<number, MonthlyTrend>();
  for (const r of raw) {
    const { year: y, month: m, type } = r._id;
    if (!monthMap.has(m)) {
      monthMap.set(m, { year: y, month: m, income: 0, expense: 0, net: 0 });
    }
    const entry = monthMap.get(m)!;
    if (type === 'INCOME') entry.income += r.total;
    if (type === 'EXPENSE') entry.expense += r.total;
    entry.net = entry.income - entry.expense;
  }

  return Array.from(monthMap.values()).sort((a, b) => a.month - b.month);
}

export async function getRecentTransactions(limit: number) {
  return transactionRepository.findRecent(limit);
}
