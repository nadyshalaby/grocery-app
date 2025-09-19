/**
 * Application configuration
 * Centralizes environment variables and configuration settings
 */

export const config = {
  database: {
    url: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/grocery_app',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
  },
  app: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000'),
  },
} as const;

export const isDevelopment = config.app.env === 'development';
export const isProduction = config.app.env === 'production';