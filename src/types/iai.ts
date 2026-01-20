/**
 * IAI Member Data
 */
export interface IAIMemberData {
  name: string;
  membershipNumber: string;
  straNumber: string;
  noWa: string;
  lastPaymentAt: string;
  lastPayment: string;
}

/**
 * IAI API Response Structure
 */
export interface IAIApiResponse {
  success: boolean;
  data: {
    success: boolean;
    data: IAIMemberData;
  };
}

/**
 * IAI API Error Response
 */
export interface IAIApiErrorResponse {
  success: false;
  error: string;
  message?: string;
}

/**
 * OTP Send Request Payload
 */
export interface OTPSendPayload {
  no_whatsapp: string;
  otp_code: string;
}
