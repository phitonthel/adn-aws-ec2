import { Router } from 'express';
import usersRouter from './user.js';
import authRouter from './auth.js';

const router = Router();

// IAI feature routes
router.use('/user', usersRouter);
router.use('/auth', authRouter);

export default router;
