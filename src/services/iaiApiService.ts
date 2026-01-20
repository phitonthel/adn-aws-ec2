import { IAIApiResponse, IAIApiErrorResponse, OTPSendPayload } from '../types/iai';

const USE_MOCK = false; // Set to false to use real API
const IAI_API_URL = 'https://ext-api.iai.or.id/otorisasi_otp.php';

/**
 * Mock IAI API Service for development/testing
 */
class MockIAIApiService {
  /**
   * Mock send OTP - returns success with member data
   */
  async sendOTP(payload: OTPSendPayload): Promise<IAIApiResponse> {
    console.log('[MOCK] Sending OTP:', payload);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Mock successful response
    return {
      success: true,
      data: {
        name: 'Ar. Tester Iai Interaktif, IAI',
        membershipNumber: '99998',
        straNumber: '1.234.56789',
        noWa: payload.no_whatsapp,
        lastPaymentAt: '2024',
        lastPayment: '2026',
      },
    };
  }
}

/**
 * Real IAI API Service
 */
class RealIAIApiService {
  /**
   * Send OTP to IAI API
   */
  async sendOTP(payload: OTPSendPayload): Promise<IAIApiResponse | IAIApiErrorResponse> {
    console.log('Calling external IAI API with payload:', payload);

    const response = await fetch(IAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response body:', errorText);
      throw new Error(`IAI API error: ${response.status} ${response.statusText}`);
    }

    const responseText = await response.text();
    console.log('Raw response:', responseText);

    if (!responseText || responseText.trim().length === 0) {
      console.log('Empty response from external API');
      throw new Error('IAI API returned empty response');
    }

    try {
      const data: IAIApiResponse = JSON.parse(responseText);
      console.log('Parsed IAI API Response:', data);
      return data;
    } catch (parseError) {
      console.log('Failed to parse JSON:', parseError);
      throw new Error('Invalid JSON response from IAI API');
    }
  }
}

/**
 * IAI API Service - automatically uses mock or real based on environment
 */
export class IAIApiService {
  private static service = USE_MOCK ? new MockIAIApiService() : new RealIAIApiService();

  static async sendOTP(payload: OTPSendPayload): Promise<IAIApiResponse | IAIApiErrorResponse> {
    if (USE_MOCK) {
      console.log('[MOCK MODE] Using mock IAI API');
    }
    return this.service.sendOTP(payload);
  }

  static isMockMode(): boolean {
    return USE_MOCK;
  }
}
