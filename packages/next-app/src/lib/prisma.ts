import { PrismaClient } from '@prisma/client';

// This prevents creating a new PrismaClient on every hot-reload in development
declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;