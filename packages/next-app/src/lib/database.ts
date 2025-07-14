/**
 * Database Connection - Data Persistence Layer
 * 
 * Database connection and query utilities for the application.
 * Provides abstracted database operations and connection
 * management for data persistence.
 * 
 * @responsibilities
 * - Establishes database connections
 * - Provides query execution utilities
 * - Handles database error management
 * - Manages connection pooling and cleanup
 * - Abstracts database operations for application use
 */

// packages/next-app/src/lib/prisma.ts
import prisma from '@repo/db';
export default prisma;