import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, Role, UserStatus } from '../modules/users/user.model';
import { Transaction, TransactionType } from '../modules/transactions/transaction.model';
import { env } from '../config/env';

const categories = ['Salary', 'Freelance', 'Rent', 'Groceries', 'Utilities', 'Entertainment', 'Travel', 'Healthcare'];

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seed() {
  await mongoose.connect(env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Clear existing data
  await User.deleteMany({});
  await Transaction.deleteMany({});
  console.log('Cleared existing data');

  // Create users
  const hashedPassword = await bcrypt.hash('Password1', env.BCRYPT_ROUNDS);

  const users = await User.insertMany([
    { name: 'Admin User', email: 'admin@findash.com', password: hashedPassword, role: Role.ADMIN, status: UserStatus.ACTIVE },
    { name: 'Analyst User', email: 'analyst@findash.com', password: hashedPassword, role: Role.ANALYST, status: UserStatus.ACTIVE },
    { name: 'Viewer User', email: 'viewer@findash.com', password: hashedPassword, role: Role.VIEWER, status: UserStatus.ACTIVE },
    { name: 'Inactive User', email: 'inactive@findash.com', password: hashedPassword, role: Role.VIEWER, status: UserStatus.INACTIVE },
  ]);

  console.log(`Created ${users.length} users`);

  const adminId = users[0]._id;

  // Generate 60 transactions over the last 12 months
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);

  interface SeedTransaction {
    amount: number;
    type: TransactionType;
    category: string;
    date: Date;
    description: string;
    createdBy: unknown;
    deletedAt: Date | null;
  }

  const transactions: SeedTransaction[] = Array.from({ length: 60 }, () => {
    const type = Math.random() > 0.4 ? TransactionType.INCOME : TransactionType.EXPENSE;
    const category = categories[Math.floor(Math.random() * categories.length)];
    const amount = parseFloat((Math.random() * 4900 + 100).toFixed(2));
    return {
      amount,
      type,
      category,
      date: randomDate(twelveMonthsAgo, now),
      description: `${type === 'INCOME' ? 'Received' : 'Paid'} for ${category}`,
      createdBy: adminId,
      deletedAt: null,
    };
  });

  // Add two soft-deleted transactions to demonstrate the feature
  transactions.push(
    {
      amount: 250,
      type: TransactionType.EXPENSE,
      category: 'Entertainment',
      date: randomDate(twelveMonthsAgo, now),
      description: 'Deleted transaction (soft delete demo)',
      createdBy: adminId,
      deletedAt: new Date(),
    },
    {
      amount: 100,
      type: TransactionType.EXPENSE,
      category: 'Travel',
      date: randomDate(twelveMonthsAgo, now),
      description: 'Another deleted transaction',
      createdBy: adminId,
      deletedAt: new Date(),
    }
  );

  await Transaction.insertMany(transactions);
  console.log(`Created ${transactions.length} transactions (including 2 soft-deleted)`);

  console.log('\n=== Seed complete ===');
  console.log('Demo accounts (all passwords: Password1):');
  console.log('  admin@findash.com    → ADMIN');
  console.log('  analyst@findash.com  → ANALYST');
  console.log('  viewer@findash.com   → VIEWER');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
