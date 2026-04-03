import { Request, Response, NextFunction } from 'express';
import * as transactionService from './transaction.service';
import { createTransactionDto, updateTransactionDto, transactionQueryDto } from './transaction.dto';
import { sendSuccess, buildPaginationMeta } from '../../common/utils/response';

/**
 * @swagger
 * /api/transactions:
 *   post:
 *     tags: [Transactions]
 *     summary: Create a transaction (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTransactionDto'
 *     responses:
 *       201:
 *         description: Transaction created
 *       400:
 *         description: Validation error
 */
export async function createTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = createTransactionDto.parse(req.body);
    const transaction = await transactionService.createTransaction(dto, req.user!.id);
    sendSuccess(res, transaction, 201);
  } catch (err) {
    next(err);
  }
}

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     tags: [Transactions]
 *     summary: Get all transactions with filters and pagination
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [INCOME, EXPENSE] }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Paginated transactions list
 */
export async function getTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = transactionQueryDto.parse(req.query);
    const { transactions, total } = await transactionService.getTransactions(query);
    sendSuccess(res, transactions, 200, buildPaginationMeta(query.page, query.limit, total));
  } catch (err) {
    next(err);
  }
}

/**
 * @swagger
 * /api/transactions/{id}:
 *   get:
 *     tags: [Transactions]
 *     summary: Get a transaction by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Transaction details
 *       404:
 *         description: Transaction not found
 */
export async function getTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const transaction = await transactionService.getTransactionById(req.params.id);
    sendSuccess(res, transaction);
  } catch (err) {
    next(err);
  }
}

/**
 * @swagger
 * /api/transactions/{id}:
 *   patch:
 *     tags: [Transactions]
 *     summary: Update a transaction (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTransactionDto'
 *     responses:
 *       200:
 *         description: Transaction updated
 *       404:
 *         description: Transaction not found
 */
export async function updateTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = updateTransactionDto.parse(req.body);
    const transaction = await transactionService.updateTransaction(req.params.id, dto);
    sendSuccess(res, transaction);
  } catch (err) {
    next(err);
  }
}

/**
 * @swagger
 * /api/transactions/{id}:
 *   delete:
 *     tags: [Transactions]
 *     summary: Soft-delete a transaction (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Transaction deleted
 *       404:
 *         description: Transaction not found
 */
export async function deleteTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await transactionService.deleteTransaction(req.params.id);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}
