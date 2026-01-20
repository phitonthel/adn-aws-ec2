import { Router, Request, Response } from 'express';
import { OTPService } from '../../../services/otpService';
import { generateTokenFromPhone } from '../../../utils/jwt';
import { IAIApiService } from '../../../services/iaiApiService';
import { IAIApiResponse, IAIMemberData } from '../../../types/iai';

const router = Router();

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

    // Store OTP in Redis
    await OTPService.storeOTP(phoneNumber, otpCode);
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

    // Generate JWT token
    const token = generateTokenFromPhone(phoneNumber);

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        phoneNumber,
        token,
        tokenType: 'Bearer',
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
