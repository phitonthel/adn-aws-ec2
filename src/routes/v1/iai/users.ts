import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /v1/iai/users
 * Get all users (requires authentication)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const users = await prisma.iaiUser.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        membershipNumber: true,
        straNumber: true,
        lastPaymentAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.status(200).json({ status: 'ok', data: users });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * GET /v1/iai/users/:id
 * Get user by ID (requires authentication)
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.iaiUser.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ status: 'ok', data: user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * POST /v1/iai/users
 * Create new user (requires authentication)
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { email, name, membershipNumber, straNumber, lastPaymentAt } = req.body;

    if (!email || !name || !membershipNumber || !straNumber) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const user = await prisma.iaiUser.create({
      data: {
        email,
        name,
        membershipNumber,
        straNumber,
        lastPaymentAt: lastPaymentAt ? new Date(lastPaymentAt) : null,
      },
    });

    res.status(201).json({ status: 'ok', data: user });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Email, membership number, or STR number already exists' });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
});

export default router;
