import { Request, Response, NextFunction } from 'express';
import * as userService from './user.service';
import { assignRoleDto, updateStatusDto, userListQueryDto } from './user.dto';
import { sendSuccess, buildPaginationMeta } from '../../common/utils/response';

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: List all users (Admin only)
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
 *         name: role
 *         schema: { type: string, enum: [VIEWER, ANALYST, ADMIN] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [ACTIVE, INACTIVE] }
 *     responses:
 *       200:
 *         description: List of users
 */
export async function listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, role, status } = userListQueryDto.parse(req.query);
    const { users, total } = await userService.listUsers({ role, status }, page, limit);
    sendSuccess(res, users, 200, buildPaginationMeta(page, limit, total));
  } catch (err) {
    next(err);
  }
}

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 */
export async function getUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await userService.getUserById(req.params.id);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}

/**
 * @swagger
 * /api/users/{id}/role:
 *   patch:
 *     tags: [Users]
 *     summary: Assign a role to a user (Admin only)
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
 *             $ref: '#/components/schemas/AssignRoleDto'
 *     responses:
 *       200:
 *         description: Role updated
 */
export async function assignRole(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { role } = assignRoleDto.parse(req.body);
    const user = await userService.assignRole(req.params.id, role);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}

/**
 * @swagger
 * /api/users/{id}/status:
 *   patch:
 *     tags: [Users]
 *     summary: Activate or deactivate a user (Admin only)
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
 *             $ref: '#/components/schemas/UpdateStatusDto'
 *     responses:
 *       200:
 *         description: Status updated
 */
export async function updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status } = updateStatusDto.parse(req.body);
    const user = await userService.updateStatus(req.params.id, status);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}
