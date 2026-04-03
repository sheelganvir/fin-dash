import mongoose, { Document, Schema, Types } from 'mongoose';

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export interface ITransaction extends Document {
  amount: number;
  type: TransactionType;
  category: string;
  date: Date;
  description?: string;
  createdBy: Types.ObjectId;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    amount: { type: Number, required: true, min: [0.01, 'Amount must be greater than 0'] },
    type: { type: String, enum: Object.values(TransactionType), required: true },
    category: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    description: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Indexes for analytics queries and filtering
transactionSchema.index({ date: -1 });
transactionSchema.index({ category: 1 });
transactionSchema.index({ date: -1, category: 1 });
transactionSchema.index({ createdBy: 1 });
transactionSchema.index({ type: 1, deletedAt: 1 });

export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);
