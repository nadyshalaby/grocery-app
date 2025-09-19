/**
 * User login API route
 */

import { NextRequest } from 'next/server';
import { authService } from '@/lib/services/auth.service';
import { LoginRequest } from '@/lib/types/auth.types';
import { ValidationError, AuthenticationError, AppError } from '@/lib/utils/errors';

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();

    const result = await authService.login(body);

    return Response.json({
      message: 'Login successful',
      user: result.user,
      tokens: result.tokens,
    });

  } catch (error) {
    console.error('Login error:', error);

    if (error instanceof ValidationError || error instanceof AuthenticationError) {
      return Response.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    if (error instanceof AppError) {
      return Response.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}