import { Request, Response, NextFunction } from 'express';
import { Role } from '../../modules/users/user.model';
import { ForbiddenError } from '../errors/HttpErrors';

export function authorizeRoles(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ForbiddenError('You do not have permission to perform this action'));
    }
    next();
  };
}
