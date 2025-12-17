# adn-aws-ec2

A small server running on EC2 instance with Express, TypeScript, PostgreSQL, and Prisma ORM.

## Tech Stack

- **Runtime:** Node.js 22
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Package Manager:** Yarn

## Prerequisites

- Node.js 22.x
- PostgreSQL (local or remote)
- Yarn

## Installation

1. Clone the repository and navigate to the project:

```bash
cd adn-aws-ec2
```

2. Install dependencies:

```bash
yarn install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Update `.env` with your database connection string and other configuration.

## Database Setup

1. Create the initial Prisma migration:

```bash
yarn prisma:migrate
```

This will create a migration for the `users` table.

2. (Optional) Seed the database with sample data:

```bash
yarn prisma:seed
```

## Development

Start the development server with hot-reload:

```bash
yarn dev
```

The server will run on `http://localhost:3000`.

## Building

Build the TypeScript project:

```bash
yarn build
```

## Production

Build and start the server:

```bash
yarn build
yarn start
```

## Endpoints

### Health Check

```
GET /health
```

Returns the server health status with a timestamp.

**Response:**

```json
{
  "status": "healthy",
  "message": "Server is running",
  "timestamp": "2025-12-17T10:30:00.000Z"
}
```

## Prisma Commands

- `yarn prisma:migrate` - Create and apply migrations
- `yarn prisma:deploy` - Deploy migrations in production
- `yarn prisma:generate` - Generate Prisma client
- `yarn prisma:seed` - Run seed script

## Project Structure

```
├── src/
│   ├── index.ts          # Application entry point
│   └── routes/
│       └── health.ts     # Health check endpoint
├── prisma/
│   ├── schema.prisma     # Prisma schema
│   ├── migrations/       # Database migrations
│   └── seed.ts           # Database seeding script
├── dist/                 # Compiled JavaScript (generated)
├── .env.example          # Environment variables template
├── tsconfig.json         # TypeScript configuration
└── package.json          # Project dependencies
```

## Environment Variables

See `.env.example` for all available configuration options.

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/adn_db
```

## Notes

- The server gracefully handles SIGTERM and SIGINT signals for clean shutdown
- Prisma client is automatically disconnected on shutdown
- All TypeScript code is compiled to ES2022 standard