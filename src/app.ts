import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';

import { swaggerSpec } from './config/swagger';
import { rateLimiter } from './common/middleware/rateLimiter';
import { errorHandler } from './common/errors/errorHandler';
import { env } from './config/env';

import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import transactionRoutes from './modules/transactions/transaction.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';

export function createApp() {
  const app = express();

  // Security & parsing
  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  // HTTP logging (dev only)
  if (env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Rate limiting
  app.use('/api', rateLimiter);

  // API Docs
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ success: true, message: 'Finance Dashboard API is running' });
  });

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/transactions', transactionRoutes);
  app.use('/api/analytics', analyticsRoutes);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
  });

  // Global error handler
  app.use(errorHandler);

  return app;
}
