/**
 * User repository - handles all user data access
 */

import { query } from '../database/connection';
import { User, CreateUserRequest } from '../types/auth.types';
import { DatabaseError, NotFoundError, ConflictError } from '../utils/errors';

export interface UserRepository {
  create(userData: CreateUserRequest & { passwordHash: string }): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: number): Promise<User | null>;
  findByIdWithPassword(id: number): Promise<User & { passwordHash: string } | null>;
}

export class PostgresUserRepository implements UserRepository {
  /**
   * Create a new user
   */
  async create(userData: CreateUserRequest & { passwordHash: string }): Promise<User> {
    const { email, passwordHash } = userData;

    try {
      const result = await query<any>(
        `INSERT INTO users (email, password_hash)
         VALUES ($1, $2)
         RETURNING id, email, created_at, updated_at`,
        [email, passwordHash]
      );

      if (result.rowCount === 0) {
        throw new DatabaseError('Failed to create user');
      }

      return {
        id: result.rows[0].id,
        email: result.rows[0].email,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at,
      };
    } catch (error: any) {
      if (error.code === '23505') { // PostgreSQL unique violation
        throw new ConflictError('Email already exists');
      }
      throw error;
    }
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const result = await query<any>(
      `SELECT id, email, created_at, updated_at
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (result.rowCount === 0) {
      return null;
    }

    return {
      id: result.rows[0].id,
      email: result.rows[0].email,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at,
    };
  }

  /**
   * Find user by ID
   */
  async findById(id: number): Promise<User | null> {
    const result = await query<any>(
      `SELECT id, email, created_at, updated_at
       FROM users
       WHERE id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return null;
    }

    return {
      id: result.rows[0].id,
      email: result.rows[0].email,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at,
    };
  }

  /**
   * Find user by ID including password hash (for authentication)
   */
  async findByIdWithPassword(id: number): Promise<User & { passwordHash: string } | null> {
    const result = await query<any>(
      `SELECT id, email, password_hash, created_at, updated_at
       FROM users
       WHERE id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return null;
    }

    return {
      id: result.rows[0].id,
      email: result.rows[0].email,
      passwordHash: result.rows[0].password_hash,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at,
    };
  }
}

// Export singleton instance
export const userRepository = new PostgresUserRepository();