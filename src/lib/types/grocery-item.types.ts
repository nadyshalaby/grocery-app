/**
 * Grocery item related types
 */

export interface GroceryItem {
  id: number;
  userId: number;
  name: string;
  quantity: number;
  store?: string;
  category?: string;
  notes?: string;
  isPurchased: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateGroceryItemRequest {
  name: string;
  quantity?: number;
  store?: string;
  category?: string;
  notes?: string;
}

export interface UpdateGroceryItemRequest {
  name?: string;
  quantity?: number;
  store?: string;
  category?: string;
  notes?: string;
  isPurchased?: boolean;
}

export interface GroceryItemFilters {
  store?: string;
  category?: string;
  isPurchased?: boolean;
  search?: string;
}

export type GroceryItemResponse = Omit<GroceryItem, 'userId'>;