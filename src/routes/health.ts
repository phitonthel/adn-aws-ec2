import { Router, Request, Response } from 'express';

const router = Router();

/**
 * GET /health
 * Returns the health status of the server
 */
router.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
