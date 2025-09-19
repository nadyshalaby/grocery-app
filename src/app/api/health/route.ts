/**
 * Health check endpoint for monitoring and load balancer health checks
 */

import { NextRequest } from 'next/server';
import { getPool } from '@/lib/database/connection';

export async function GET(request: NextRequest) {
  try {
    // Check database connectivity
    const pool = getPool();
    await pool.query('SELECT 1');

    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'connected',
        api: 'operational'
      }
    });

  } catch (error) {
    console.error('Health check failed:', error);

    return Response.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'disconnected',
        api: 'operational'
      }
    }, { status: 503 });
  }
}