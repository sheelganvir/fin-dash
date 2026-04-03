import { z } from 'zod';
import { Role, UserStatus } from './user.model';

export const assignRoleDto = z.object({
  role: z.nativeEnum(Role),
});

export const updateStatusDto = z.object({
  status: z.nativeEnum(UserStatus),
});

export const userListQueryDto = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('20').transform(Number),
  role: z.nativeEnum(Role).optional(),
  status: z.nativeEnum(UserStatus).optional(),
});

export type AssignRoleDto = z.infer<typeof assignRoleDto>;
export type UpdateStatusDto = z.infer<typeof updateStatusDto>;
export type UserListQueryDto = z.infer<typeof userListQueryDto>;
