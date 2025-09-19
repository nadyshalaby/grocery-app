/**
 * User registration API route
 */

import { NextRequest } from 'next/server';
import { authService } from '@/lib/services/auth.service';
import { CreateUserRequest } from '@/lib/types/auth.types';
import { ValidationError, ConflictError, AppError } from '@/lib/utils/errors';

export async function POST(request: NextRequest) {
  try {
    const body: CreateUserRequest = await request.json();

    const result = await authService.register(body);

    return Response.json({
      message: 'User registered successfully',
      user: result.user,
      tokens: result.tokens,
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);

    if (error instanceof ValidationError || error instanceof ConflictError) {
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