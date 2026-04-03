import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { UserRepository } from '../users/user.repository';
import { Role } from '../users/user.model';
import { ConflictError, UnauthorizedError } from '../../common/errors/HttpErrors';
import type { RegisterDto, LoginDto } from './auth.dto';

const userRepository = new UserRepository();

export interface JwtPayload {
  sub: string;
  role: Role;
  iat?: number;
  exp?: number;
}

function signToken(userId: string, role: Role): string {
  return jwt.sign({ sub: userId, role } as JwtPayload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export async function registerUser(dto: RegisterDto): Promise<{ token: string; user: object }> {
  const exists = await userRepository.existsByEmail(dto.email);
  if (exists) throw new ConflictError('Email already registered');

  const user = await userRepository.create({
    name: dto.name,
    email: dto.email,
    password: dto.password,
  });

  const token = signToken(String(user._id), user.role);
  return {
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status },
  };
}

export async function loginUser(dto: LoginDto): Promise<{ token: string; user: object }> {
  const user = await userRepository.findByEmail(dto.email, true);
  if (!user) throw new UnauthorizedError('Invalid credentials');
  if (user.status === 'INACTIVE') throw new UnauthorizedError('Account is inactive');

  const valid = await user.comparePassword(dto.password);
  if (!valid) throw new UnauthorizedError('Invalid credentials');

  const token = signToken(String(user._id), user.role);
  return {
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status },
  };
}
