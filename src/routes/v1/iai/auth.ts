import { Router, Request, Response } from 'express';
import { OTPService } from '../../../services/otpService';
import { generateToken, generateTokenFromPhone, UserTokenData } from '../../../utils/jwt';
import { IAIApiService } from '../../../services/iaiApiService';
import { IAIApiResponse, IAIMemberData } from '../../../types/iai';

const router = Router();

// IP Whitelist for SSO endpoint
const SSO_WHITELIST = process.env.SSO_IP_WHITELIST
  ? process.env.SSO_IP_WHITELIST.split(',').map((ip) => ip.trim())
  : [];

/**
 * Middleware to check IP whitelist
 */
const checkIPWhitelist = (req: Request, res: Response, next: any) => {
  // If whitelist is empty, allow all
  if (SSO_WHITELIST.length === 0) {
    console.log('✓ SSO whitelist is empty - allowing all IPs');
    return next();
  }

  const clientIP =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    '';

  console.log('SSO request from IP:', clientIP);
  console.log('Whitelist:', SSO_WHITELIST);

  if (SSO_WHITELIST.includes(clientIP)) {
    console.log('✓ IP is whitelisted');
    return next();
  }

  console.log('✗ IP not in whitelist - blocking request');
  return res.status(403).json({
    success: false,
    error: 'Forbidden',
    message: 'Your IP address is not authorized to access this endpoint',
  });
};

/**
 * POST /v1/iai/auth/sso-create-token
 * Create JWT token from user data (for external systems)
 */
router.post('/sso-create-token', checkIPWhitelist, async (req: Request, res: Response) => {
  try {
    const { name, membershipNumber, straNumber, phoneNumber } = req.body;

    // Validate required fields
    if (!name || !membershipNumber || !straNumber || !phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['name', 'membershipNumber', 'straNumber', 'phoneNumber'],
      });
    }

    console.log('Creating SSO token for:', { phoneNumber, membershipNumber });

    // Generate JWT token
    const userData: UserTokenData = {
      phoneNumber,
      name,
      membershipNumber,
      straNumber,
    };

    const token = generateToken(userData);

    return res.status(200).json({
      success: true,
      message: 'Token created successfully',
      data: {
        token,
        tokenType: 'Bearer',
        expiresIn: '7d',
      },
    });
  } catch (error) {
    console.error('SSO token creation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /v1/iai/auth/send-otp
 * Send OTP code for IAI member authentication
 */
router.post('/send-otp', async (req: Request, res: Response) => {
  try {
    const { phoneNumber } = req.body;
    // Validate input
    if (!phoneNumber) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['phoneNumber'],
      });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP

    console.log(`Generated OTP Code for ${phoneNumber}: ${otpCode}`);

    // Call external IAI API (or mock)
    const payload = {
      no_whatsapp: phoneNumber,
      otp_code: otpCode,
    };

    const apiResponse = await IAIApiService.sendOTP(payload);

    if (!apiResponse.success) {
      return res.status(400).json({
        success: false,
        error: 'Failed to send OTP',
        message: 'error' in apiResponse ? apiResponse.error : 'Phone number not registered as IAI member.',
      });
    }

    const iaiData: IAIApiResponse = apiResponse as IAIApiResponse;
    const memberData: IAIMemberData = iaiData.data;

    // Validate STRA number
    if (!memberData.straNumber || memberData.straNumber.trim() === '') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only IAI members with STRA are allowed to use this service.',
      });
    }

    // Validate payment recency (within 4 years)
    const currentYear = new Date().getFullYear();
    const lastPaymentYear = parseInt(memberData.lastPayment);
    const yearsSincePayment = currentYear - lastPaymentYear;

    if (yearsSincePayment > 4) {
      return res.status(403).json({
        success: false,
        error: 'Payment expired',
        message: `Your last payment was in ${lastPaymentYear}. Please update your membership payment to continue using this service.`,
        details: {
          lastPayment: lastPaymentYear,
          yearsSincePayment,
        },
      });
    }

    // Store OTP and cache user data in Redis (after all validations pass)
    await OTPService.storeOTPWithUserData(phoneNumber, otpCode, memberData);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully. Please check your WhatsApp.',
      data: {
        phoneNumber,
        expiresIn: 600, // 10 minutes
        memberInfo: memberData,
        mockMode: IAIApiService.isMockMode(),
      },
    });
  } catch (error) {
    console.log('Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /v1/iai/auth/verify-otp
 * Verify OTP code and generate JWT token
 */
router.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    const { phoneNumber, otpCode } = req.body;

    // Validate input
    if (!phoneNumber || !otpCode) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['phoneNumber', 'otpCode'],
      });
    }

    // Verify OTP
    const result = await OTPService.verifyOTP(phoneNumber, otpCode);

    if (!result.valid) {
      return res.status(401).json({
        success: false,
        error: result.error,
      });
    }

    // Retrieve cached member data from Redis
    const memberData = await OTPService.getUserData(phoneNumber);

    if (!memberData) {
      // Fallback: generate token with phoneNumber only if cached data not found
      console.warn('Cached user data not found, using phoneNumber-only token');
      const token = generateTokenFromPhone(phoneNumber);
      return res.status(200).json({
        success: true,
        message: 'OTP verified successfully',
        data: {
          phoneNumber,
          token,
          tokenType: 'Bearer',
        },
      });
    }

    // Generate JWT token with full user data
    const userData: UserTokenData = {
      phoneNumber,
      name: memberData.name,
      membershipNumber: memberData.membershipNumber,
      straNumber: memberData.straNumber,
    };

    const token = generateToken(userData);

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        phoneNumber,
        token,
        tokenType: 'Bearer',
        memberInfo: {
          name: memberData.name,
          membershipNumber: memberData.membershipNumber,
          straNumber: memberData.straNumber,
        },
      },
    });
  } catch (error) {
    console.log('Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
