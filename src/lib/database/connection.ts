/**
 * PostgreSQL database connection management
 */

import { Pool, PoolClient } from 'pg';
import { config, isDevelopment } from '../config';
import { DatabaseError } from '../utils/errors';

let pool: Pool | null = null;

/**
 * Initialize database connection pool
 */
export function initializeDatabase(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: config.database.url,
      max: config.database.maxConnections,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ssl: config.database.url.includes('sslmode=disable') ? false :
           isDevelopment ? false : { rejectUnauthorized: false },
    });

    // Handle pool errors
    pool.on('error', (err: Error) => {
      console.error('Database pool error:', err);
    });

    // Log connection events in development
    if (isDevelopment) {
      pool.on('connect', () => {
        console.log('Database client connected');
      });
    }
  }

  return pool;
}

/**
 * Get database connection pool
 */
export function getPool(): Pool {
  if (!pool) {
    return initializeDatabase();
  }
  return pool;
}

/**
 * Execute a query with automatic connection handling
 */
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<{ rows: T[]; rowCount: number }> {
  const client = getPool();
  try {
    const result = await client.query(text, params);
    return {
      rows: result.rows,
      rowCount: result.rowCount || 0,
    };
  } catch (error) {
    console.error('Database query error:', error);
    throw new DatabaseError('Database query failed');
  }
}

/**
 * Execute multiple queries in a transaction
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Transaction error:', error);
    throw new DatabaseError('Transaction failed');
  } finally {
    client.release();
  }
}

/**
 * Close database connections (for cleanup)
 */
export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}