import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app';

const app = createApp();

let adminToken: string;
let analystToken: string;
let viewerToken: string;

beforeAll(async () => {
  const uri = process.env.MONGODB_URI_TEST ?? 'mongodb://localhost:27017/fin-dash-test';
  await mongoose.connect(uri);

  const { User } = await import('../src/modules/users/user.model');
  const { Transaction } = await import('../src/modules/transactions/transaction.model');

  // Register users
  const ts = Date.now();
  const adminEmail = `admin_ana_${ts}@test.com`;
  const analystEmail = `analyst_ana_${ts}@test.com`;
  const viewerEmail = `viewer_ana_${ts}@test.com`;

  const adminReg = await request(app).post('/api/auth/register').send({ name: 'Admin', email: adminEmail, password: 'Password1' });
  const analystReg = await request(app).post('/api/auth/register').send({ name: 'Analyst', email: analystEmail, password: 'Password1' });
  const viewerReg = await request(app).post('/api/auth/register').send({ name: 'Viewer', email: viewerEmail, password: 'Password1' });

  await User.findByIdAndUpdate(adminReg.body.data.user.id, { role: 'ADMIN' });
  await User.findByIdAndUpdate(analystReg.body.data.user.id, { role: 'ANALYST' });

  const adminLogin = await request(app).post('/api/auth/login').send({ email: adminEmail, password: 'Password1' });
  const analystLogin = await request(app).post('/api/auth/login').send({ email: analystEmail, password: 'Password1' });

  adminToken = adminLogin.body.data.token;
  analystToken = analystLogin.body.data.token;
  viewerToken = viewerReg.body.data.token;

  // Seed some transactions
  const adminId = adminReg.body.data.user.id;
  await Transaction.insertMany([
    { amount: 5000, type: 'INCOME', category: 'Salary', date: new Date('2025-01-15'), createdBy: adminId, deletedAt: null },
    { amount: 2000, type: 'INCOME', category: 'Freelance', date: new Date('2025-02-10'), createdBy: adminId, deletedAt: null },
    { amount: 800, type: 'EXPENSE', category: 'Rent', date: new Date('2025-01-20'), createdBy: adminId, deletedAt: null },
    { amount: 300, type: 'EXPENSE', category: 'Groceries', date: new Date('2025-02-05'), createdBy: adminId, deletedAt: null },
    { amount: 500, type: 'EXPENSE', category: 'Rent', date: new Date('2025-03-01'), createdBy: adminId, deletedAt: null },
    { amount: 100, type: 'EXPENSE', category: 'Groceries', date: new Date('2025-01-01'), createdBy: adminId, deletedAt: new Date() },
  ]);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe('Analytics API', () => {
  describe('GET /api/analytics/summary', () => {
    it('analyst should get the financial summary', async () => {
      const res = await request(app)
        .get('/api/analytics/summary')
        .set('Authorization', `Bearer ${analystToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('totalIncome');
      expect(res.body.data).toHaveProperty('totalExpense');
      expect(res.body.data).toHaveProperty('netBalance');
      expect(res.body.data.totalIncome).toBe(7000);
      expect(res.body.data.totalExpense).toBe(1600);
      expect(res.body.data.netBalance).toBe(5400);
    });

    it('viewer should be forbidden from analytics', async () => {
      const res = await request(app)
        .get('/api/analytics/summary')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(403);
    });

    it('admin should also access analytics', async () => {
      const res = await request(app)
        .get('/api/analytics/summary')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/analytics/category-breakdown', () => {
    it('should return category breakdown', async () => {
      const res = await request(app)
        .get('/api/analytics/category-breakdown')
        .set('Authorization', `Bearer ${analystToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      const categories = res.body.data.map((d: { category: string }) => d.category);
      expect(categories).toContain('Salary');
      expect(categories).toContain('Rent');
    });
  });

  describe('GET /api/analytics/monthly-trends', () => {
    it('should return monthly trends for given year', async () => {
      const res = await request(app)
        .get('/api/analytics/monthly-trends?year=2025')
        .set('Authorization', `Bearer ${analystToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      const months = res.body.data.map((d: { month: number }) => d.month);
      expect(months).toContain(1);
      expect(months).toContain(2);
    });
  });

  describe('GET /api/analytics/recent', () => {
    it('should return last N transactions (not including soft-deleted)', async () => {
      const res = await request(app)
        .get('/api/analytics/recent?limit=3')
        .set('Authorization', `Bearer ${analystToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(3);
      expect(res.body.data.every((t: { deletedAt: null }) => t.deletedAt === null)).toBe(true);
    });
  });
});
