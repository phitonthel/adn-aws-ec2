import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { isIpWhitelisted } from '../utils/whitelist.js';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Check if IP is whitelisted
  const clientIp = req.ip || req.socket.remoteAddress || '';
  if (isIpWhitelisted(clientIp)) {
    return next();
  }

  // Check for Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.slice(7); // Remove 'Bearer ' prefix
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Attach decoded token to request
  (req as any).user = decoded;
  next();
};
