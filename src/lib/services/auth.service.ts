/**
 * Authentication service - handles authentication business logic
 */

import { userRepository, UserRepository } from '../repositories/user.repository';
import { hashPassword, verifyPassword } from '../auth/password';
import { generateTokens } from '../auth/jwt';
import {
  User,
  CreateUserRequest,
  LoginRequest,
  AuthTokens
} from '../types/auth.types';
import {
  AuthenticationError,
  ConflictError
} from '../utils/errors';
import { createUserSchema, loginSchema, validateRequestBody } from '../utils/validation';

export interface AuthService {
  register(userData: CreateUserRequest): Promise<{ user: User; tokens: AuthTokens }>;
  login(loginData: LoginRequest): Promise<{ user: User; tokens: AuthTokens }>;
  validateUser(userId: number): Promise<User>;
}

export class AuthServiceImpl implements AuthService {
  constructor(private userRepo: UserRepository) {}

  /**
   * Register a new user
   */
  async register(userData: CreateUserRequest): Promise<{ user: User; tokens: AuthTokens }> {
    // Validate input with Zod schema
    const validatedData = validateRequestBody(createUserSchema, userData);
    const { email, password } = validatedData;

    // Check if user already exists
    const existingUser = await this.userRepo.findByEmail(email);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);
    const user = await this.userRepo.create({ email, password, passwordHash });

    // Generate tokens
    const tokens = generateTokens(user.id, user.email);

    return { user, tokens };
  }

  /**
   * Login user
   */
  async login(loginData: LoginRequest): Promise<{ user: User; tokens: AuthTokens }> {
    // Validate input with Zod schema
    const validatedData = validateRequestBody(loginSchema, loginData);
    const { email, password } = validatedData;

    // Find user with password
    const userWithPassword = await this.userRepo.findByIdWithPassword(
      (await this.userRepo.findByEmail(email))?.id || 0
    );

    if (!userWithPassword) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, userWithPassword.passwordHash);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Remove password from user object
    const { passwordHash, ...user } = userWithPassword;

    // Generate tokens
    const tokens = generateTokens(user.id, user.email);

    return { user, tokens };
  }

  /**
   * Validate user exists and return user data
   */
  async validateUser(userId: number): Promise<User> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new AuthenticationError('User not found');
    }
    return user;
  }
}

// Export singleton instance
export const authService = new AuthServiceImpl(userRepository);