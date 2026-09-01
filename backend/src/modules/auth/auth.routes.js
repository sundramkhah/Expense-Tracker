import { Router } from 'express';
import asyncHandler from '../../utils/asyncHandler.js';
import validate from '../../middlewares/validate.middleware.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import { loginSchema, registerSchema } from './auth.validator.js';
import * as controller from './auth.controller.js';

const router = Router();
router.post('/register', validate(registerSchema), asyncHandler(controller.register));
router.post('/login', validate(loginSchema), asyncHandler(controller.login));
router.get('/me', authMiddleware, controller.me);

export default router;
