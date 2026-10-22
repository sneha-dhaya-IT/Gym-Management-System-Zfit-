import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import CartService from "../services/cart.service.js";


// create an instance of the service
const cartService = new CartService();

// Zod validation schemas
const addToCartSchema = z.object({
  memberId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid member ID format"),
  itemId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid item ID format"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
});

const updateCartSchema = z.object({
  quantity: z.number().min(1, "Quantity must be at least 1"),
});

const cartIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid cart ID format"),
});



//  Add item to cart
export const addToCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = addToCartSchema.parse(req.body);
    const cartItem = await cartService.addItem(validated.memberId, validated.itemId, validated.quantity);

    res.status(201).json({
      success: true,
      message: "Item added to cart successfully",
      data: cartItem,
    });
  } catch (error) {
    next(error);
  }
};

//  Get all cart items for a member
export const getCartByMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { memberId } = z.object({ memberId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid member ID format") }).parse(req.params);
    const cart = await cartService.getCart(memberId);

    if (!cart) {
      return res.status(404).json({ 
        success: false, 
        message: "Cart not found",
        data: { items: [] }
      });
    }

    res.status(200).json({
      success: true,
      message: "Cart items retrieved successfully",
      data: cart,
      count: cart.items.length,
    });
  } catch (error) {
    next(error);
  }
};

//  Update cart item quantity
export const updateCartItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { memberId, itemId } = z.object({ 
      memberId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid member ID format"),
      itemId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid item ID format")
    }).parse(req.params);
    const validated = updateCartSchema.parse(req.body);

    const updatedCart = await cartService.updateItem(memberId, itemId, validated.quantity);
    if (!updatedCart) {
      return res.status(404).json({ success: false, message: "Cart item not found" });
    }

    res.status(200).json({
      success: true,
      message: "Cart item updated successfully",
      data: updatedCart,
    });
  } catch (error) {
    next(error);
  }
};

//  Remove cart item
export const removeCartItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { memberId, itemId } = z.object({ 
      memberId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid member ID format"),
      itemId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid item ID format")
    }).parse(req.params);
    
    const updatedCart = await cartService.removeItem(memberId, itemId);

    if (!updatedCart) {
      return res.status(404).json({ success: false, message: "Cart item not found" });
    }

    res.status(200).json({
      success: true,
      message: "Cart item removed successfully",
      data: updatedCart,
    });
  } catch (error) {
    next(error);
  }
};

// Process checkout - reduce stock and log transactions
export const processCheckout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { memberId } = z.object({ memberId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid member ID format") }).parse(req.params);
    const { referenceId } = z.object({ referenceId: z.string().optional() }).parse(req.body);
    
    const result = await cartService.processCheckout(memberId, referenceId);

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        transactionIds: result.transactionIds
      },
    });
  } catch (error) {
    next(error);
  }
};

// Clear cart for a member
export const clearCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { memberId } = z.object({ memberId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid member ID format") }).parse(req.params);
    const clearedCart = await cartService.clearCart(memberId);

    res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      data: clearedCart,
    });
  } catch (error) {
    next(error);
  }
};
