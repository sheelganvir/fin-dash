import { Request, Response, NextFunction } from 'express';
import { registerDto, loginDto } from './auth.dto';
import * as authService from './auth.service';
import { sendSuccess } from '../../common/utils/response';

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterDto'
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already registered
 */
export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = registerDto.parse(req.body);
    const result = await authService.registerUser(dto);
    sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login and receive a JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginDto'
 *     responses:
 *       200:
 *         description: Login successful, token returned
 *       401:
 *         description: Invalid credentials
 */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = loginDto.parse(req.body);
    const result = await authService.loginUser(dto);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}
