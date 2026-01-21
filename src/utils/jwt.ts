import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface UserTokenData {
  phoneNumber: string;
  name: string;
  membershipNumber: string;
  straNumber: string;
  type?: string;
}

export interface TokenPayload extends UserTokenData {
  iat?: number;
  exp?: number;
}

export const generateToken = (userData: UserTokenData): string => {
  return jwt.sign(
    {
      phoneNumber: userData.phoneNumber,
      name: userData.name,
      membershipNumber: userData.membershipNumber,
      straNumber: userData.straNumber,
      type: 'iai_member',
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Deprecated: Use generateToken instead
export const generateTokenFromPhone = (phoneNumber: string): string => {
  return jwt.sign({ phoneNumber, type: 'iai_member' }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

export const verifyToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
};

// Deprecated: Use verifyToken instead
export const verifyPhoneToken = (
  token: string
): { phoneNumber: string; type: string } | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as { phoneNumber: string; type: string };
  } catch (error) {
    return null;
  }
};
