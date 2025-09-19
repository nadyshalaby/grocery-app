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
  ValidationError,
  AuthenticationError,
  ConflictError
} from '../utils/errors';

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
    const { email, password } = userData;

    // Validate input
    this.validateEmail(email);
    this.validatePassword(password);

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
    const { email, password } = loginData;

    // Validate input
    this.validateEmail(email);
    if (!password) {
      throw new ValidationError('Password is required');
    }

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

  /**
   * Validate email format
   */
  private validateEmail(email: string): void {
    if (!email) {
      throw new ValidationError('Email is required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('Invalid email format');
    }
  }

  /**
   * Validate password strength
   */
  private validatePassword(password: string): void {
    if (!password) {
      throw new ValidationError('Password is required');
    }

    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }

    // Add more password validation rules as needed
    // Example: require uppercase, lowercase, numbers, special characters
  }
}

// Export singleton instance
export const authService = new AuthServiceImpl(userRepository);