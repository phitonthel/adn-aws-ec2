import { Router } from 'express';
import iaiRouter from './iai/index.js';

const router = Router();

// Feature: IAI
router.use('/iai', iaiRouter);

export default router;
