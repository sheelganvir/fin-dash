import { UserRepository } from './user.repository';
import { Role, UserStatus } from './user.model';
import { NotFoundError } from '../../common/errors/HttpErrors';

const userRepository = new UserRepository();

export async function listUsers(
  filters: { role?: Role; status?: UserStatus },
  page: number,
  limit: number
) {
  return userRepository.findAll(filters, page, limit);
}

export async function getUserById(id: string) {
  const user = await userRepository.findById(id);
  if (!user) throw new NotFoundError('User not found');
  return user;
}

export async function assignRole(id: string, role: Role) {
  const user = await userRepository.updateRole(id, role);
  if (!user) throw new NotFoundError('User not found');
  return user;
}

export async function updateStatus(id: string, status: UserStatus) {
  const user = await userRepository.updateStatus(id, status);
  if (!user) throw new NotFoundError('User not found');
  return user;
}
