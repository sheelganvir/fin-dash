import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app';

const app = createApp();

beforeAll(async () => {
  const uri = process.env.MONGODB_URI_TEST ?? 'mongodb://localhost:27017/fin-dash-test';
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe('Auth API', () => {
  const userPayload = {
    name: 'Test User',
    email: `test_${Date.now()}@example.com`,
    password: 'Password1',
  };

  describe('POST /api/auth/register', () => {
    it('should register a new user and return a token', async () => {
      const res = await request(app).post('/api/auth/register').send(userPayload);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(userPayload.email);
      expect(res.body.data.user.role).toBe('VIEWER');
    });

    it('should return 409 when email is already registered', async () => {
      const res = await request(app).post('/api/auth/register').send(userPayload);
      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when email is invalid', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Bad', email: 'not-an-email', password: 'Password1' });
      expect(res.status).toBe(400);
    });

    it('should return 400 when password is too weak', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Bad', email: 'bad@test.com', password: 'weak' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login and return a token', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: userPayload.email,
        password: userPayload.password,
      });
      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
    });

    it('should return 401 with wrong password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: userPayload.email,
        password: 'WrongPass9',
      });
      expect(res.status).toBe(401);
    });

    it('should return 401 with non-existent email', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'nobody@nowhere.com',
        password: 'Password1',
      });
      expect(res.status).toBe(401);
    });
  });
});
