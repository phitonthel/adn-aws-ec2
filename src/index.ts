import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import healthRouter from './routes/health';
import v1Router from './routes/v1/index';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : ['http://localhost:3000', 'http://localhost:5173', 'https://iai-calculator.web.app'];

console.log('CORS Configuration:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- Allowed Origins:', allowedOrigins);

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    console.log('CORS request from origin:', origin);

    // Allow requests with no origin (like mobile apps, curl, or Postman)
    if (!origin) {
      console.log('✓ No origin - allowing');
      return callback(null, true);
    }

    // In development, allow all origins
    if (process.env.NODE_ENV !== 'production') {
      console.log('✓ Development mode - allowing all origins');
      return callback(null, true);
    }

    // In production, check whitelist
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('✓ Origin in whitelist - allowing');
      callback(null, true);
    } else {
      console.log('✗ Origin NOT in whitelist - blocking');
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Public routes (no auth required)
app.use('/health', healthRouter);

// Apply authentication middleware to all other routes
// app.use(authMiddleware);

// Protected routes
app.use('/v1', v1Router);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const server = app.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    console.log('HTTP server closed');
    await prisma.$disconnect();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(async () => {
    console.log('HTTP server closed');
    await prisma.$disconnect();
    process.exit(0);
  });
});

export default app;
