/**
 * Authentication middleware for Next.js API routes
 */

import { NextRequest } from 'next/server';
import { verifyToken, extractTokenFromHeader } from './jwt';
import { authService } from '../services/auth.service';
import { User } from '../types/auth.types';
import { AuthenticationError } from '../utils/errors';

export interface AuthenticatedRequest extends NextRequest {
  user: User;
}

/**
 * Middleware to authenticate and authorize API requests
 */
export async function authenticate(request: NextRequest): Promise<User> {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    // Verify token and extract payload
    const payload = verifyToken(token);

    // Validate user still exists and get current user data
    const user = await authService.validateUser(payload.userId);

    return user;
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    throw new AuthenticationError('Authentication failed');
  }
}

/**
 * Higher-order function to wrap API route handlers with authentication
 */
export function withAuth(
  handler: (request: NextRequest, context: { params: Promise<any> }, user: User) => Promise<Response>
) {
  return async (request: NextRequest, context: { params: Promise<any> }): Promise<Response> => {
    try {
      const user = await authenticate(request);
      return await handler(request, context, user);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: error.statusCode,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  };
}