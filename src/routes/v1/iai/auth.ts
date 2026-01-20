import { Router, Request, Response } from 'express';

const router = Router();

/**
 * POST /v1/iai/auth/send-otp
 * Verify OTP code for IAI member authentication
 */
router.post('/send-otp', async (req: Request, res: Response) => {
  try {
    const { phoneNumber } = req.body;
    console.log(req.body)

    // Validate input
    if (!phoneNumber) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['phoneNumber'],
      });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
    console.log(`Generated OTP Code for ${phoneNumber}: ${otpCode}`);

    // Call external IAI API
    const payload = {
      no_whatsapp: phoneNumber,
      otp_code: otpCode,
    };

    console.log("Calling external API with JSON payload:", payload);

    const response = await fetch('https://ext-api.iai.or.id/otorisasi_otp.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      console.log("OTP Verification Failed:", response.status, response.statusText);
      const errorText = await response.text();
      console.log("Error response body:", errorText);
      return res.status(response.status).json({
        error: 'OTP verification failed',
        status: response.status,
        statusText: response.statusText,
        details: errorText || 'Empty response',
      });
    }

    const responseText = await response.text();
    console.log("Raw response:", responseText);
    console.log("Response length:", responseText.length);

    // Handle empty response
    if (!responseText || responseText.trim().length === 0) {
      console.log("Empty response from external API");
      return res.status(200).json({
        success: false,
        error: 'External API returned empty response',
        message: 'The IAI API did not return any data. The endpoint may not exist or may require different parameters.',
      });
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.log("Failed to parse JSON:", parseError);
      return res.status(200).json({
        success: true,
        data: responseText, // Return raw text if not JSON
        isRawText: true,
      });
    }

    console.log("OTP Verification Response:", data);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.log("Error:", error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
