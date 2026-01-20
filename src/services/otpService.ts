import redis from './redisClient';

const OTP_EXPIRY = 600; // 10 minutes in seconds
const MAX_ATTEMPTS = 3;

export class OTPService {
  private static getOTPKey(phoneNumber: string): string {
    return `otp:${phoneNumber}`;
  }

  private static getAttemptsKey(phoneNumber: string): string {
    return `otp_attempts:${phoneNumber}`;
  }

  /**
   * Store OTP code for a phone number
   * @param phoneNumber - The phone number to store OTP for
   * @param otpCode - The OTP code to store
   */
  static async storeOTP(phoneNumber: string, otpCode: string): Promise<void> {
    const key = this.getOTPKey(phoneNumber);
    await redis.setex(key, OTP_EXPIRY, otpCode);
    // Reset attempts when new OTP is generated
    await redis.del(this.getAttemptsKey(phoneNumber));
    console.log(`Stored OTP for ${phoneNumber}, expires in ${OTP_EXPIRY}s`);
  }

  /**
   * Verify OTP code for a phone number
   * @param phoneNumber - The phone number to verify OTP for
   * @param otpCode - The OTP code to verify
   * @returns Object with valid boolean and optional error message
   */
  static async verifyOTP(
    phoneNumber: string,
    otpCode: string
  ): Promise<{
    valid: boolean;
    error?: string;
  }> {
    const key = this.getOTPKey(phoneNumber);
    const attemptsKey = this.getAttemptsKey(phoneNumber);

    // Check and increment attempts
    const attempts = await redis.incr(attemptsKey);
    if (attempts === 1) {
      // Set expiry on first attempt
      await redis.expire(attemptsKey, OTP_EXPIRY);
    }

    if (attempts > MAX_ATTEMPTS) {
      // Invalidate OTP after max attempts
      await redis.del(key);
      return {
        valid: false,
        error: 'Maximum verification attempts exceeded. Please request a new OTP.',
      };
    }

    const storedOTP = await redis.get(key);

    if (!storedOTP) {
      return {
        valid: false,
        error: 'OTP expired or not found. Please request a new OTP.',
      };
    }

    if (storedOTP !== otpCode) {
      return {
        valid: false,
        error: `Invalid OTP code. ${MAX_ATTEMPTS - attempts} attempts remaining.`,
      };
    }

    // Valid OTP - clean up
    await redis.del(key);
    await redis.del(attemptsKey);
    console.log(`OTP verified successfully for ${phoneNumber}`);

    return { valid: true };
  }

  /**
   * Check if a phone number has a valid OTP
   * @param phoneNumber - The phone number to check
   * @returns Boolean indicating if valid OTP exists
   */
  static async hasValidOTP(phoneNumber: string): Promise<boolean> {
    const key = this.getOTPKey(phoneNumber);
    const exists = await redis.exists(key);
    return exists === 1;
  }

  /**
   * Delete OTP for a phone number (e.g., for testing or admin purposes)
   * @param phoneNumber - The phone number to delete OTP for
   */
  static async deleteOTP(phoneNumber: string): Promise<void> {
    const key = this.getOTPKey(phoneNumber);
    const attemptsKey = this.getAttemptsKey(phoneNumber);
    await redis.del(key);
    await redis.del(attemptsKey);
    console.log(`Deleted OTP for ${phoneNumber}`);
  }
}
