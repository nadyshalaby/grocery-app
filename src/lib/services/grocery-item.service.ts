/**
 * Grocery item service - handles grocery item business logic
 */

import {
  groceryItemRepository,
  GroceryItemRepository
} from '../repositories/grocery-item.repository';
import {
  GroceryItem,
  CreateGroceryItemRequest,
  UpdateGroceryItemRequest,
  GroceryItemFilters,
  GroceryItemResponse
} from '../types/grocery-item.types';
import { NotFoundError } from '../utils/errors';
import {
  createGroceryItemSchema,
  updateGroceryItemSchema,
  groceryItemFiltersSchema,
  idSchema,
  validateRequestBody
} from '../utils/validation';

export interface GroceryItemService {
  createItem(userId: number, itemData: CreateGroceryItemRequest): Promise<GroceryItemResponse>;
  getItem(id: number, userId: number): Promise<GroceryItemResponse>;
  getUserItems(userId: number, filters?: GroceryItemFilters): Promise<GroceryItemResponse[]>;
  updateItem(id: number, userId: number, updateData: UpdateGroceryItemRequest): Promise<GroceryItemResponse>;
  deleteItem(id: number, userId: number): Promise<void>;
  markAsPurchased(id: number, userId: number): Promise<GroceryItemResponse>;
  markAsNotPurchased(id: number, userId: number): Promise<GroceryItemResponse>;
}

export class GroceryItemServiceImpl implements GroceryItemService {
  constructor(private groceryItemRepo: GroceryItemRepository) {}

  /**
   * Create a new grocery item
   */
  async createItem(userId: number, itemData: CreateGroceryItemRequest): Promise<GroceryItemResponse> {
    // Validate input with Zod schema
    const validatedData = validateRequestBody(createGroceryItemSchema, itemData);

    const item = await this.groceryItemRepo.create(userId, validatedData);
    return this.toGroceryItemResponse(item);
  }

  /**
   * Get a specific grocery item
   */
  async getItem(id: number, userId: number): Promise<GroceryItemResponse> {
    // Validate ID with Zod schema
    validateRequestBody(idSchema, id);

    const item = await this.groceryItemRepo.findById(id, userId);
    if (!item) {
      throw new NotFoundError('Grocery item not found');
    }

    return this.toGroceryItemResponse(item);
  }

  /**
   * Get all grocery items for a user
   */
  async getUserItems(userId: number, filters?: GroceryItemFilters): Promise<GroceryItemResponse[]> {
    // Validate filters if provided with Zod schema
    if (filters) {
      filters = validateRequestBody(groceryItemFiltersSchema, filters);
    }

    const items = await this.groceryItemRepo.findByUserId(userId, filters);
    return items.map(item => this.toGroceryItemResponse(item));
  }

  /**
   * Update a grocery item
   */
  async updateItem(id: number, userId: number, updateData: UpdateGroceryItemRequest): Promise<GroceryItemResponse> {
    // Validate ID and update data with Zod schemas
    validateRequestBody(idSchema, id);
    const validatedData = validateRequestBody(updateGroceryItemSchema, updateData);

    const item = await this.groceryItemRepo.update(id, userId, validatedData);
    return this.toGroceryItemResponse(item);
  }

  /**
   * Delete a grocery item
   */
  async deleteItem(id: number, userId: number): Promise<void> {
    // Validate ID with Zod schema
    validateRequestBody(idSchema, id);

    const deleted = await this.groceryItemRepo.delete(id, userId);
    if (!deleted) {
      throw new NotFoundError('Grocery item not found');
    }
  }

  /**
   * Mark item as purchased
   */
  async markAsPurchased(id: number, userId: number): Promise<GroceryItemResponse> {
    return this.updateItem(id, userId, { isPurchased: true });
  }

  /**
   * Mark item as not purchased
   */
  async markAsNotPurchased(id: number, userId: number): Promise<GroceryItemResponse> {
    return this.updateItem(id, userId, { isPurchased: false });
  }

  /**
   * Convert GroceryItem to response format (removes userId)
   */
  private toGroceryItemResponse(item: GroceryItem): GroceryItemResponse {
    const { userId, ...response } = item;
    return response;
  }
}

// Export singleton instance
export const groceryItemService = new GroceryItemServiceImpl(groceryItemRepository);