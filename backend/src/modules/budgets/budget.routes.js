import { Router } from 'express';
import auth from '../../middlewares/auth.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import asyncHandler from '../../utils/asyncHandler.js';
import * as controller from './budget.controller.js';
import { createBudgetSchema, updateBudgetSchema } from './budget.validator.js';

const router = Router();
router.use(auth);
router.get('/', asyncHandler(controller.list));
router.post('/', validate(createBudgetSchema), asyncHandler(controller.create));
router.patch('/:id', validate(updateBudgetSchema), asyncHandler(controller.update));
router.delete('/:id', asyncHandler(controller.remove));
export default router;
