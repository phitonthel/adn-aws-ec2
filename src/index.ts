import express from 'express';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import healthRouter from './routes/health.js';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

// Middleware
app.use(express.json());

// Health check route
app.use('/health', healthRouter);

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
