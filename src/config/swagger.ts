import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Finance Dashboard API',
      version: '1.0.0',
      description:
        'Finance Data Processing and Access Control Dashboard — REST API with RBAC (VIEWER / ANALYST / ADMIN)',
      contact: { name: 'API Support' },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        RegisterDto: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', example: 'Jane Doe' },
            email: { type: 'string', format: 'email', example: 'jane@example.com' },
            password: { type: 'string', example: 'Password1' },
          },
        },
        LoginDto: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'jane@example.com' },
            password: { type: 'string', example: 'Password1' },
          },
        },
        AssignRoleDto: {
          type: 'object',
          required: ['role'],
          properties: {
            role: { type: 'string', enum: ['VIEWER', 'ANALYST', 'ADMIN'] },
          },
        },
        UpdateStatusDto: {
          type: 'object',
          required: ['status'],
          properties: {
            status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
          },
        },
        CreateTransactionDto: {
          type: 'object',
          required: ['amount', 'type', 'category', 'date'],
          properties: {
            amount: { type: 'number', example: 1500.00 },
            type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
            category: { type: 'string', example: 'Salary' },
            date: { type: 'string', format: 'date-time', example: '2025-06-01T00:00:00.000Z' },
            description: { type: 'string', example: 'Monthly salary' },
          },
        },
        UpdateTransactionDto: {
          type: 'object',
          properties: {
            amount: { type: 'number' },
            type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
            category: { type: 'string' },
            date: { type: 'string', format: 'date-time' },
            description: { type: 'string' },
          },
        },
      },
    },
  },
  apis: ['./src/modules/**/*.controller.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
