import { Request, Response, NextFunction } from 'express';
import * as analyticsService from './analytics.service';
import { sendSuccess } from '../../common/utils/response';
import { z } from 'zod';

/**
 * @swagger
 * /api/analytics/summary:
 *   get:
 *     tags: [Analytics]
 *     summary: Get total income, expense, and net balance (Analyst/Admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Financial summary
 */
export async function getSummary(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await analyticsService.getSummary();
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

/**
 * @swagger
 * /api/analytics/category-breakdown:
 *   get:
 *     tags: [Analytics]
 *     summary: Get income and expense totals by category (Analyst/Admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Category breakdown
 */
export async function getCategoryBreakdown(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await analyticsService.getCategoryBreakdown();
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

/**
 * @swagger
 * /api/analytics/monthly-trends:
 *   get:
 *     tags: [Analytics]
 *     summary: Get monthly income/expense trends for a given year (Analyst/Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema: { type: integer, example: 2025 }
 *         description: Year to fetch trends for (defaults to current year)
 *     responses:
 *       200:
 *         description: Monthly trends
 */
export async function getMonthlyTrends(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { year } = z.object({
      year: z.string().optional().default(String(new Date().getFullYear())).transform(Number),
    }).parse(req.query);
    const data = await analyticsService.getMonthlyTrends(year);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

/**
 * @swagger
 * /api/analytics/recent:
 *   get:
 *     tags: [Analytics]
 *     summary: Get the most recent transactions (Analyst/Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *         description: Number of recent transactions to return
 *     responses:
 *       200:
 *         description: Recent transactions
 */
export async function getRecentTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { limit } = z.object({
      limit: z.string().optional().default('10').transform(Number),
    }).parse(req.query);
    const data = await analyticsService.getRecentTransactions(Math.min(limit, 100));
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}
