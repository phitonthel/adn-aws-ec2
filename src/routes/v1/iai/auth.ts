import { Router, Request, Response } from 'express';
import { generateToken } from '../../../utils/jwt.js';

const router = Router();

/**
 * POST /v1/iai/auth/login
 * Login endpoint - takes email and returns JWT token
 */
router.post('/login', (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  const token = generateToken(email);
  res.status(200).json({
    status: 'ok',
    message: 'Login successful',
    token,
    email,
  });
});

export default router;
