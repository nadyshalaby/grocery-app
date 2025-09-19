/**
 * Grocery item repository - handles all grocery item data access
 */

import { query } from '../database/connection';
import {
  GroceryItem,
  CreateGroceryItemRequest,
  UpdateGroceryItemRequest,
  GroceryItemFilters
} from '../types/grocery-item.types';
import { DatabaseError, NotFoundError } from '../utils/errors';

export interface GroceryItemRepository {
  create(userId: number, itemData: CreateGroceryItemRequest): Promise<GroceryItem>;
  findById(id: number, userId: number): Promise<GroceryItem | null>;
  findByUserId(userId: number, filters?: GroceryItemFilters): Promise<GroceryItem[]>;
  update(id: number, userId: number, updateData: UpdateGroceryItemRequest): Promise<GroceryItem>;
  delete(id: number, userId: number): Promise<boolean>;
}

export class PostgresGroceryItemRepository implements GroceryItemRepository {
  /**
   * Create a new grocery item
   */
  async create(userId: number, itemData: CreateGroceryItemRequest): Promise<GroceryItem> {
    const { name, quantity = 1, category, notes } = itemData;

    const result = await query<GroceryItem>(
      `INSERT INTO grocery_items (user_id, name, quantity, category, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, name, quantity, category, notes, is_purchased, created_at, updated_at`,
      [userId, name, quantity, category || null, notes || null]
    );

    if (result.rowCount === 0) {
      throw new DatabaseError('Failed to create grocery item');
    }

    return this.mapDbRowToGroceryItem(result.rows[0]);
  }

  /**
   * Find grocery item by ID (with user isolation)
   */
  async findById(id: number, userId: number): Promise<GroceryItem | null> {
    const result = await query<any>(
      `SELECT id, user_id, name, quantity, category, notes, is_purchased, created_at, updated_at
       FROM grocery_items
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result.rowCount === 0) {
      return null;
    }

    return this.mapDbRowToGroceryItem(result.rows[0]);
  }

  /**
   * Find all grocery items for a user with optional filters
   */
  async findByUserId(userId: number, filters?: GroceryItemFilters): Promise<GroceryItem[]> {
    let queryText = `
      SELECT id, user_id, name, quantity, category, notes, is_purchased, created_at, updated_at
      FROM grocery_items
      WHERE user_id = $1
    `;
    const params: any[] = [userId];
    let paramIndex = 2;

    // Apply filters
    if (filters?.category) {
      queryText += ` AND category = $${paramIndex}`;
      params.push(filters.category);
      paramIndex++;
    }

    if (filters?.isPurchased !== undefined) {
      queryText += ` AND is_purchased = $${paramIndex}`;
      params.push(filters.isPurchased);
      paramIndex++;
    }

    if (filters?.search) {
      queryText += ` AND (name ILIKE $${paramIndex} OR notes ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    queryText += ` ORDER BY created_at DESC`;

    const result = await query<any>(queryText, params);
    return result.rows.map(row => this.mapDbRowToGroceryItem(row));
  }

  /**
   * Update a grocery item
   */
  async update(id: number, userId: number, updateData: UpdateGroceryItemRequest): Promise<GroceryItem> {
    const updateFields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Build dynamic update query
    if (updateData.name !== undefined) {
      updateFields.push(`name = $${paramIndex}`);
      params.push(updateData.name);
      paramIndex++;
    }

    if (updateData.quantity !== undefined) {
      updateFields.push(`quantity = $${paramIndex}`);
      params.push(updateData.quantity);
      paramIndex++;
    }

    if (updateData.category !== undefined) {
      updateFields.push(`category = $${paramIndex}`);
      params.push(updateData.category);
      paramIndex++;
    }

    if (updateData.notes !== undefined) {
      updateFields.push(`notes = $${paramIndex}`);
      params.push(updateData.notes);
      paramIndex++;
    }

    if (updateData.isPurchased !== undefined) {
      updateFields.push(`is_purchased = $${paramIndex}`);
      params.push(updateData.isPurchased);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      throw new DatabaseError('No fields to update');
    }

    // Add WHERE clause parameters
    params.push(id, userId);
    const whereClause = `WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}`;

    const queryText = `
      UPDATE grocery_items
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      ${whereClause}
      RETURNING id, user_id, name, quantity, category, notes, is_purchased, created_at, updated_at
    `;

    const result = await query<any>(queryText, params);

    if (result.rowCount === 0) {
      throw new NotFoundError('Grocery item not found');
    }

    return this.mapDbRowToGroceryItem(result.rows[0]);
  }

  /**
   * Delete a grocery item
   */
  async delete(id: number, userId: number): Promise<boolean> {
    const result = await query(
      `DELETE FROM grocery_items
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    return result.rowCount > 0;
  }

  /**
   * Map database row to GroceryItem object
   */
  private mapDbRowToGroceryItem(row: any): GroceryItem {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      quantity: row.quantity,
      category: row.category,
      notes: row.notes,
      isPurchased: row.is_purchased,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

// Export singleton instance
export const groceryItemRepository = new PostgresGroceryItemRepository();