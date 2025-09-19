/**
 * Grocery item API routes - GET, PUT, DELETE individual items
 */

import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { groceryItemService } from '@/lib/services/grocery-item.service';
import { UpdateGroceryItemRequest } from '@/lib/types/grocery-item.types';
import { ValidationError, NotFoundError, AppError } from '@/lib/utils/errors';
import { User } from '@/lib/types/auth.types';

/**
 * GET /api/grocery-items/[id] - Get a specific grocery item
 */
export const GET = withAuth(async (
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> },
  user: User
) => {
  try {
    const params = await paramsPromise;
    const itemId = parseInt(params.id);

    if (isNaN(itemId)) {
      return Response.json(
        { error: 'Invalid item ID' },
        { status: 400 }
      );
    }

    const item = await groceryItemService.getItem(itemId, user.id);

    return Response.json({
      message: 'Grocery item retrieved successfully',
      item,
    });

  } catch (error) {
    console.error('Get grocery item error:', error);

    if (error instanceof NotFoundError || error instanceof ValidationError) {
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
 * PUT /api/grocery-items/[id] - Update a grocery item
 */
export const PUT = withAuth(async (
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> },
  user: User
) => {
  try {
    const params = await paramsPromise;
    const itemId = parseInt(params.id);

    if (isNaN(itemId)) {
      return Response.json(
        { error: 'Invalid item ID' },
        { status: 400 }
      );
    }

    const body: UpdateGroceryItemRequest = await request.json();

    const item = await groceryItemService.updateItem(itemId, user.id, body);

    return Response.json({
      message: 'Grocery item updated successfully',
      item,
    });

  } catch (error) {
    console.error('Update grocery item error:', error);

    if (error instanceof NotFoundError || error instanceof ValidationError) {
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
 * DELETE /api/grocery-items/[id] - Delete a grocery item
 */
export const DELETE = withAuth(async (
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> },
  user: User
) => {
  try {
    const params = await paramsPromise;
    const itemId = parseInt(params.id);

    if (isNaN(itemId)) {
      return Response.json(
        { error: 'Invalid item ID' },
        { status: 400 }
      );
    }

    await groceryItemService.deleteItem(itemId, user.id);

    return Response.json({
      message: 'Grocery item deleted successfully',
    });

  } catch (error) {
    console.error('Delete grocery item error:', error);

    if (error instanceof NotFoundError || error instanceof ValidationError) {
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