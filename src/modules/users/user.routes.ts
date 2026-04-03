import { Router } from 'express';
import { listUsers, getUser, assignRole, updateStatus } from './user.controller';
import { verifyJWT } from '../../common/middleware/verifyJWT';
import { authorizeRoles } from '../../common/middleware/authorizeRoles';
import { Role } from './user.model';

const router = Router();

router.use(verifyJWT, authorizeRoles(Role.ADMIN));

router.get('/', listUsers);
router.get('/:id', getUser);
router.patch('/:id/role', assignRole);
router.patch('/:id/status', updateStatus);

export default router;
