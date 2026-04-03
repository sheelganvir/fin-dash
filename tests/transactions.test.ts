import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app';

const app = createApp();

let adminToken: string;
let viewerToken: string;

beforeAll(async () => {
  const uri = process.env.MONGODB_URI_TEST ?? 'mongodb://localhost:27017/fin-dash-test';
  await mongoose.connect(uri);

  // Register admin
  await request(app).post('/api/auth/register').send({
    name: 'Admin',
    email: `admin_txn_${Date.now()}@test.com`,
    password: 'Password1',
  });

  // Patch the first user to ADMIN directly via mongoose for test setup
  const { User } = await import('../src/modules/users/user.model');
  await User.findOneAndUpdate({}, { role: 'ADMIN' });

  const adminLogin = await request(app).post('/api/auth/login').send({
    email: `admin_txn_${Date.now() - 1}@test.com`,
    password: 'Password1',
  });

  // Register admin properly
  const adminEmail = `admin2_txn_${Date.now()}@test.com`;
  const adminReg = await request(app).post('/api/auth/register').send({
    name: 'Admin2',
    email: adminEmail,
    password: 'Password1',
  });
  await User.findByIdAndUpdate(adminReg.body.data.user.id, { role: 'ADMIN' });
  const adminLoginRes = await request(app).post('/api/auth/login').send({
    email: adminEmail,
    password: 'Password1',
  });
  adminToken = adminLoginRes.body.data.token;

  // Register viewer
  const viewerEmail = `viewer_txn_${Date.now()}@test.com`;
  const viewerReg = await request(app).post('/api/auth/register').send({
    name: 'Viewer',
    email: viewerEmail,
    password: 'Password1',
  });
  viewerToken = viewerReg.body.data.token;
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

const sampleTransaction = {
  amount: 1500,
  type: 'INCOME',
  category: 'Salary',
  date: '2025-06-01T00:00:00.000Z',
  description: 'Monthly salary',
};

describe('Transactions API', () => {
  let transactionId: string;

  describe('POST /api/transactions', () => {
    it('admin should create a transaction', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(sampleTransaction);
      expect(res.status).toBe(201);
      expect(res.body.data.amount).toBe(1500);
      transactionId = res.body.data._id;
    });

    it('viewer should be forbidden from creating', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send(sampleTransaction);
      expect(res.status).toBe(403);
    });

    it('unauthenticated request should return 401', async () => {
      const res = await request(app).post('/api/transactions').send(sampleTransaction);
      expect(res.status).toBe(401);
    });

    it('should return 400 for invalid amount', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...sampleTransaction, amount: -100 });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/transactions', () => {
    it('viewer should be able to list transactions', async () => {
      const res = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.meta).toBeDefined();
    });

    it('should filter by type', async () => {
      const res = await request(app)
        .get('/api/transactions?type=INCOME')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.every((t: { type: string }) => t.type === 'INCOME')).toBe(true);
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/transactions?page=1&limit=5')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.limit).toBe(5);
    });
  });

  describe('PATCH /api/transactions/:id', () => {
    it('admin should update a transaction', async () => {
      const res = await request(app)
        .patch(`/api/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 2000, description: 'Updated' });
      expect(res.status).toBe(200);
      expect(res.body.data.amount).toBe(2000);
    });

    it('viewer should be forbidden from updating', async () => {
      const res = await request(app)
        .patch(`/api/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ amount: 999 });
      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/transactions/:id', () => {
    it('admin should soft-delete a transaction', async () => {
      const res = await request(app)
        .delete(`/api/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('deleted transaction should no longer appear in list', async () => {
      const res = await request(app)
        .get(`/api/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(404);
    });
  });
});
