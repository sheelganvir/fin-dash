import { User, IUser, Role, UserStatus } from './user.model';
import { FilterQuery } from 'mongoose';

export class UserRepository {
  async findById(id: string): Promise<IUser | null> {
    return User.findById(id);
  }

  async findByEmail(email: string, withPassword = false): Promise<IUser | null> {
    const query = User.findOne({ email });
    if (withPassword) query.select('+password');
    return query;
  }

  async create(data: { name: string; email: string; password: string; role?: Role }): Promise<IUser> {
    return User.create(data);
  }

  async findAll(
    filters: { role?: Role; status?: UserStatus },
    page: number,
    limit: number
  ): Promise<{ users: IUser[]; total: number }> {
    const query: FilterQuery<IUser> = {};
    if (filters.role) query.role = filters.role;
    if (filters.status) query.status = filters.status;

    const [users, total] = await Promise.all([
      User.find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .select('-password')
        .lean() as unknown as Promise<IUser[]>,
      User.countDocuments(query),
    ]);
    return { users, total };
  }

  async updateRole(id: string, role: Role): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, { role }, { new: true }).select('-password');
  }

  async updateStatus(id: string, status: UserStatus): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, { status }, { new: true }).select('-password');
  }

  async existsByEmail(email: string): Promise<boolean> {
    return !!(await User.exists({ email }));
  }
}
