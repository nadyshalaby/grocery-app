/**
 * Input validation schemas using Zod
 */

import { z } from 'zod';

// User validation schemas
export const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Grocery item validation schemas
export const createGroceryItemSchema = z.object({
  name: z.string().min(1, 'Item name is required').max(255, 'Item name must be 255 characters or less'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').optional().default(1),
  store: z.string().max(255, 'Store name must be 255 characters or less').optional(),
  category: z.string().max(100, 'Category must be 100 characters or less').optional(),
  notes: z.string().max(1000, 'Notes must be 1000 characters or less').optional(),
});

export const updateGroceryItemSchema = z.object({
  name: z.string().min(1, 'Item name cannot be empty').max(255, 'Item name must be 255 characters or less').optional(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').optional(),
  store: z.string().max(255, 'Store name must be 255 characters or less').optional(),
  category: z.string().max(100, 'Category must be 100 characters or less').optional(),
  notes: z.string().max(1000, 'Notes must be 1000 characters or less').optional(),
  isPurchased: z.boolean().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

export const groceryItemFiltersSchema = z.object({
  store: z.string().max(255, 'Store filter must be 255 characters or less').optional(),
  category: z.string().max(100, 'Category filter must be 100 characters or less').optional(),
  isPurchased: z.boolean().optional(),
  search: z.string().max(255, 'Search term must be 255 characters or less').optional(),
});

// ID validation
export const idSchema = z.number().int().positive('ID must be a positive integer');

// Utility function to validate and parse request body
export function validateRequestBody<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.errors.map(err => err.message).join(', ');
    throw new Error(`Validation failed: ${errors}`);
  }

  return result.data;
}