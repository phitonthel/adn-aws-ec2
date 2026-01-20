import { Router, Request, Response } from 'express';

const router = Router();

/**
 * GET /dev/iai-users/:membershipId
 * Hits the remunerasi.iai.or.id API to fetch user data by membershipId
 */
router.get('/:membershipId', async (req: Request, res: Response) => {
  try {
    const { membershipId } = req.params;

    const response = await fetch(`https://ext-api.iai.or.id/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        membershipNumber: membershipId,
      }),
    });

    if (!response.ok) {
      console.log("Failed Response:", response.status, response.statusText);
      return res.status(response.status).json({
        error: 'Failed to fetch user from ext-api.iai.or.id',
        status: response.status,
        statusText: response.statusText,
      });
    }

    const data = await response.json();

    res.status(200).json({
      success: true,
      membershipId,
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
