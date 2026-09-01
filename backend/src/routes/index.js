import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import transactionRoutes from '../modules/transactions/transaction.routes.js';
import budgetRoutes from '../modules/budgets/budget.routes.js';
import recurringRoutes from '../modules/recurring/recurring.routes.js';
import dashboardRoutes from '../modules/dashboard/dashboard.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/transactions', transactionRoutes);
router.use('/budgets', budgetRoutes);
router.use('/recurring', recurringRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
