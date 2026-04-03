import { FilterQuery, PipelineStage, Types } from 'mongoose';
import { Transaction, ITransaction } from './transaction.model';
import type { CreateTransactionDto, UpdateTransactionDto, TransactionQueryDto } from './transaction.dto';

export class TransactionRepository {
  private baseFilter(): FilterQuery<ITransaction> {
    return { deletedAt: null };
  }

  async create(dto: CreateTransactionDto, userId: string): Promise<ITransaction> {
    return Transaction.create({
      ...dto,
      date: new Date(dto.date as string),
      createdBy: new Types.ObjectId(userId),
    });
  }

  async findAll(
    query: TransactionQueryDto
  ): Promise<{ transactions: ITransaction[]; total: number }> {
    const { page, limit, type, category, startDate, endDate } = query;
    const filter: FilterQuery<ITransaction> = this.baseFilter();

    if (type) filter.type = type;
    if (category) filter.category = { $regex: category, $options: 'i' };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('createdBy', 'name email')
        .lean() as unknown as Promise<ITransaction[]>,
      Transaction.countDocuments(filter),
    ]);

    return { transactions, total };
  }

  async findById(id: string): Promise<ITransaction | null> {
    return Transaction.findOne({ _id: id, ...this.baseFilter() }).populate('createdBy', 'name email');
  }

  async update(id: string, dto: UpdateTransactionDto): Promise<ITransaction | null> {
    const updateData: Record<string, unknown> = { ...dto };
    if (dto.date) updateData.date = new Date(dto.date as string);
    return Transaction.findOneAndUpdate(
      { _id: id, ...this.baseFilter() },
      updateData,
      { new: true }
    ).populate('createdBy', 'name email');
  }

  async softDelete(id: string): Promise<ITransaction | null> {
    return Transaction.findOneAndUpdate(
      { _id: id, ...this.baseFilter() },
      { deletedAt: new Date() },
      { new: true }
    );
  }

  // Used by analytics
  async aggregate<T>(pipeline: PipelineStage[]): Promise<T[]> {
    return Transaction.aggregate<T>(pipeline);
  }

  async findRecent(limit: number): Promise<ITransaction[]> {
    return Transaction.find(this.baseFilter())
      .sort({ date: -1 })
      .limit(limit)
      .populate('createdBy', 'name email')
      .lean() as unknown as Promise<ITransaction[]>;
  }
}
