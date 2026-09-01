import { Router } from 'express';
import auth from '../../middlewares/auth.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import asyncHandler from '../../utils/asyncHandler.js';
import * as controller from './transaction.controller.js';
import { createTransactionSchema, updateTransactionSchema } from './transaction.validator.js';

const router = Router();
router.use(auth);
router.get('/', asyncHandler(controller.list));
router.get('/:id', asyncHandler(controller.get));
router.post('/', validate(createTransactionSchema), asyncHandler(controller.create));
router.patch('/:id', validate(updateTransactionSchema), asyncHandler(controller.update));
router.delete('/:id', asyncHandler(controller.remove));
export default router;
