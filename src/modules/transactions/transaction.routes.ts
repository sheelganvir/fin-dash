import { Router } from 'express';
import {
  createTransaction,
  getTransactions,
  getTransaction,
  updateTransaction,
  deleteTransaction,
} from './transaction.controller';
import { verifyJWT } from '../../common/middleware/verifyJWT';
import { authorizeRoles } from '../../common/middleware/authorizeRoles';
import { Role } from '../users/user.model';

const router = Router();

const allRoles = [Role.VIEWER, Role.ANALYST, Role.ADMIN];
const adminOnly = [Role.ADMIN];

router.use(verifyJWT);

router.post('/', authorizeRoles(...adminOnly), createTransaction);
router.get('/', authorizeRoles(...allRoles), getTransactions);
router.get('/:id', authorizeRoles(...allRoles), getTransaction);
router.patch('/:id', authorizeRoles(...adminOnly), updateTransaction);
router.delete('/:id', authorizeRoles(...adminOnly), deleteTransaction);

export default router;
