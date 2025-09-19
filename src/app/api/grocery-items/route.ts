/**
 * Grocery items API routes - GET all items, POST new item
 */

import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { groceryItemService } from '@/lib/services/grocery-item.service';
import { CreateGroceryItemRequest, GroceryItemFilters } from '@/lib/types/grocery-item.types';
import { ValidationError, AppError } from '@/lib/utils/errors';
import { User } from '@/lib/types/auth.types';

/**
 * GET /api/grocery-items - Get all grocery items for the authenticated user
 */
export const GET = withAuth(async (request: NextRequest, _context: { params: Promise<any> }, user: User) => {
  try {
    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url);
    const filters: GroceryItemFilters = {};

    if (searchParams.get('category')) {
      filters.category = searchParams.get('category')!;
    }

    if (searchParams.get('isPurchased')) {
      filters.isPurchased = searchParams.get('isPurchased') === 'true';
    }

    if (searchParams.get('search')) {
      filters.search = searchParams.get('search')!;
    }

    const items = await groceryItemService.getUserItems(user.id, filters);

    return Response.json({
      message: 'Grocery items retrieved successfully',
      items,
      count: items.length,
    });

  } catch (error) {
    console.error('Get grocery items error:', error);

    if (error instanceof ValidationError) {
      return Response.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    if (error instanceof AppError) {
      return Response.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

/**
 * POST /api/grocery-items - Create a new grocery item
 */
export const POST = withAuth(async (request: NextRequest, _context: { params: Promise<any> }, user: User) => {
  try {
    const body: CreateGroceryItemRequest = await request.json();

    const item = await groceryItemService.createItem(user.id, body);

    return Response.json({
      message: 'Grocery item created successfully',
      item,
    }, { status: 201 });

  } catch (error) {
    console.error('Create grocery item error:', error);

    if (error instanceof ValidationError) {
      return Response.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    if (error instanceof AppError) {
      return Response.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});