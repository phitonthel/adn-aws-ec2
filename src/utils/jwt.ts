import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export const generateTokenFromPhone = (phoneNumber: string): string => {
  return jwt.sign({ phoneNumber, type: 'iai_member' }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

export const verifyPhoneToken = (
  token: string
): { phoneNumber: string; type: string } | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as { phoneNumber: string; type: string };
  } catch (error) {
    return null;
  }
};
