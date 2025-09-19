/**
 * JWT token utilities
 */

import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JWTPayload, AuthTokens } from '../types/auth.types';
import { AuthenticationError } from '../utils/errors';

/**
 * Generate access and refresh tokens for a user
 */
export function generateTokens(userId: number, email: string): AuthTokens {
  const payload: JWTPayload = { userId, email };

  const accessToken = jwt.sign(payload, config.auth.jwtSecret, {
    expiresIn: config.auth.jwtExpiresIn,
  } as jwt.SignOptions);

  const refreshToken = jwt.sign(payload, config.auth.jwtSecret, {
    expiresIn: config.auth.refreshTokenExpiresIn,
  } as jwt.SignOptions);

  return { accessToken, refreshToken };
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, config.auth.jwtSecret) as JWTPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError('Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError('Invalid token');
    }
    throw new AuthenticationError('Token verification failed');
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string {
  if (!authHeader) {
    throw new AuthenticationError('Authorization header missing');
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw new AuthenticationError('Invalid authorization header format');
  }

  return parts[1];
}