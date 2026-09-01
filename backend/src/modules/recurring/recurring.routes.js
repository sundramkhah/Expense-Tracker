import { Router } from 'express';
import auth from '../../middlewares/auth.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import asyncHandler from '../../utils/asyncHandler.js';
import * as controller from './recurring.controller.js';
import { createRecurringSchema, updateRecurringSchema } from './recurring.validator.js';

const router = Router();
router.use(auth);
router.get('/', asyncHandler(controller.list));
router.post('/', validate(createRecurringSchema), asyncHandler(controller.create));
router.patch('/:id', validate(updateRecurringSchema), asyncHandler(controller.update));
router.delete('/:id', asyncHandler(controller.remove));
export default router;
