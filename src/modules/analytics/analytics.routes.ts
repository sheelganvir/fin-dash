import { Router } from 'express';
import { getSummary, getCategoryBreakdown, getMonthlyTrends, getRecentTransactions } from './analytics.controller';
import { verifyJWT } from '../../common/middleware/verifyJWT';
import { authorizeRoles } from '../../common/middleware/authorizeRoles';
import { Role } from '../users/user.model';

const router = Router();

router.use(verifyJWT, authorizeRoles(Role.ANALYST, Role.ADMIN));

router.get('/summary', getSummary);
router.get('/category-breakdown', getCategoryBreakdown);
router.get('/monthly-trends', getMonthlyTrends);
router.get('/recent', getRecentTransactions);

export default router;
