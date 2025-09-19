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
import { ValidationError, NotFoundError } from '../utils/errors';

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
    // Validate input
    this.validateCreateItemData(itemData);

    const item = await this.groceryItemRepo.create(userId, itemData);
    return this.toGroceryItemResponse(item);
  }

  /**
   * Get a specific grocery item
   */
  async getItem(id: number, userId: number): Promise<GroceryItemResponse> {
    this.validateId(id);

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
    // Validate filters if provided
    if (filters) {
      this.validateFilters(filters);
    }

    const items = await this.groceryItemRepo.findByUserId(userId, filters);
    return items.map(item => this.toGroceryItemResponse(item));
  }

  /**
   * Update a grocery item
   */
  async updateItem(id: number, userId: number, updateData: UpdateGroceryItemRequest): Promise<GroceryItemResponse> {
    this.validateId(id);
    this.validateUpdateItemData(updateData);

    const item = await this.groceryItemRepo.update(id, userId, updateData);
    return this.toGroceryItemResponse(item);
  }

  /**
   * Delete a grocery item
   */
  async deleteItem(id: number, userId: number): Promise<void> {
    this.validateId(id);

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
   * Validate item creation data
   */
  private validateCreateItemData(data: CreateGroceryItemRequest): void {
    if (!data.name || data.name.trim().length === 0) {
      throw new ValidationError('Item name is required');
    }

    if (data.name.length > 255) {
      throw new ValidationError('Item name must be 255 characters or less');
    }

    if (data.quantity !== undefined && data.quantity < 1) {
      throw new ValidationError('Quantity must be at least 1');
    }

    if (data.store && data.store.length > 255) {
      throw new ValidationError('Store name must be 255 characters or less');
    }

    if (data.category && data.category.length > 100) {
      throw new ValidationError('Category must be 100 characters or less');
    }

    if (data.notes && data.notes.length > 1000) {
      throw new ValidationError('Notes must be 1000 characters or less');
    }
  }

  /**
   * Validate item update data
   */
  private validateUpdateItemData(data: UpdateGroceryItemRequest): void {
    if (Object.keys(data).length === 0) {
      throw new ValidationError('At least one field must be provided for update');
    }

    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        throw new ValidationError('Item name cannot be empty');
      }
      if (data.name.length > 255) {
        throw new ValidationError('Item name must be 255 characters or less');
      }
    }

    if (data.quantity !== undefined && data.quantity < 1) {
      throw new ValidationError('Quantity must be at least 1');
    }

    if (data.store !== undefined && data.store.length > 255) {
      throw new ValidationError('Store name must be 255 characters or less');
    }

    if (data.category !== undefined && data.category.length > 100) {
      throw new ValidationError('Category must be 100 characters or less');
    }

    if (data.notes !== undefined && data.notes.length > 1000) {
      throw new ValidationError('Notes must be 1000 characters or less');
    }
  }

  /**
   * Validate filters
   */
  private validateFilters(filters: GroceryItemFilters): void {
    if (filters.store && filters.store.length > 255) {
      throw new ValidationError('Store filter must be 255 characters or less');
    }

    if (filters.category && filters.category.length > 100) {
      throw new ValidationError('Category filter must be 100 characters or less');
    }

    if (filters.search && filters.search.length > 255) {
      throw new ValidationError('Search term must be 255 characters or less');
    }
  }

  /**
   * Validate ID parameter
   */
  private validateId(id: number): void {
    if (!Number.isInteger(id) || id <= 0) {
      throw new ValidationError('Invalid item ID');
    }
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