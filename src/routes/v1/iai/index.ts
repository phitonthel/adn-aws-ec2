import { Router } from 'express';
import usersRouter from './user';
import authRouter from './auth';

const router = Router();

// IAI feature routes
router.use('/user', usersRouter);
router.use('/auth', authRouter);

export default router;
