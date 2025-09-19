/**
 * Password hashing utilities using bcrypt
 */

import bcrypt from 'bcryptjs';
import { config } from '../config';

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, config.auth.bcryptRounds);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}