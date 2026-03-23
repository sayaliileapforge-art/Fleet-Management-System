import { Router } from 'express';
import {
  getDashboardStats,
  getRevenueByMonth,
  getExpenseByCategory,
  getTopVehicles,
  getTopDrivers,
} from '../controllers/dashboard.controller';

const router = Router();

router.get('/stats', getDashboardStats);
router.get('/revenue-by-month', getRevenueByMonth);
router.get('/expense-by-category', getExpenseByCategory);
router.get('/top-vehicles', getTopVehicles);
router.get('/top-drivers', getTopDrivers);

export default router;
