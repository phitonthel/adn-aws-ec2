import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export const generateToken = (email: string): string => {
  return jwt.sign({ email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string): { email: string } | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as { email: string };
  } catch (error) {
    return null;
  }
};
