import { Router } from 'express';
import auth from '../../middlewares/auth.middleware.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { dashboard } from './dashboard.controller.js';

const router = Router();
router.get('/', auth, asyncHandler(dashboard));
export default router;
