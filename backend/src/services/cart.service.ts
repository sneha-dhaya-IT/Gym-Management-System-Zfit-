import Cart from "../models/cart.model.js";
import type { ICart } from "../models/cart.model.js";
import InventoryItem from "../models/inventoryItem.schema.js";
import mongoose from "mongoose";
import { inventoryTransactionService } from "./inventoryTransaction.service.js";

export default class CartService {
  // Helper method to populate cart data
  private async populateCart(cart: ICart): Promise<ICart> {
    return await cart.populate({
      path: "items.itemId",
      populate: [
        { path: "categoryID", select: "name" },
        { path: "supplierID", select: "supplierName supplierEmail supplierPhone" }
      ]
    });
  }

  // Get cart by memberId
  async getCart(memberId: string): Promise<ICart | null> {
    return await Cart.findOne({ memberId }).populate({
      path: "items.itemId",
      populate: [
        { path: "categoryID", select: "name" },
        { path: "supplierID", select: "supplierName supplierEmail supplierPhone" }
      ]
    });
  }

  // Add item to cart
  async addItem(memberId: string, itemId: string, quantity: number): Promise<ICart> {
    // Check if item exists and get stock quantity
    const item = await InventoryItem.findById(itemId);
    if (!item) {
      throw new Error("Item not found");
    }

    let cart = await Cart.findOne({ memberId });

    if (!cart) {
      // Check stock for new cart
      if (quantity > (item.stock || 0)) {
        throw new Error(`Insufficient stock. Available: ${item.stock || 0}, Requested: ${quantity}`);
      }
      
      // If member has no cart yet, create one
      cart = new Cart({
        memberId: new mongoose.Types.ObjectId(memberId),
        items: [{ itemId: new mongoose.Types.ObjectId(itemId), quantity }],
      });
    } else {
      // If cart exists, check if item already in cart
      const itemIndex = cart.items.findIndex(
        (i) => i.itemId.toString() === itemId
      );

      if (itemIndex > -1) {
        // Check total quantity (existing + new) against stock
        const currentQuantityInCart = cart.items[itemIndex]!.quantity;
        const totalQuantity = currentQuantityInCart + quantity;
        
        if (totalQuantity > (item.stock || 0)) {
          throw new Error(`Insufficient stock. Available: ${item.stock || 0}, Already in cart: ${currentQuantityInCart}, Requested: ${quantity}`);
        }
        
        // Increment quantity if stock is sufficient
        cart.items[itemIndex]!.quantity = totalQuantity;
      } else {
        // Check stock for new item
        if (quantity > (item.stock || 0)) {
          throw new Error(`Insufficient stock. Available: ${item.stock || 0}, Requested: ${quantity}`);
        }
        
        // Otherwise push new item
        cart.items.push({ itemId: new mongoose.Types.ObjectId(itemId), quantity });
      }
    }

    const savedCart = await cart.save();
    return await this.populateCart(savedCart);
  }

  // Update item quantity in cart
  async updateItem(memberId: string, itemId: string, quantity: number): Promise<ICart | null> {
    // Check if item exists and get stock quantity
    const item = await InventoryItem.findById(itemId);
    if (!item) {
      throw new Error("Item not found");
    }

    // Check stock availability
    if (quantity > (item.stock || 0)) {
      throw new Error(`Insufficient stock. Available: ${item.stock || 0}, Requested: ${quantity}`);
    }

    const cart = await Cart.findOne({ memberId });
    if (!cart) return null;

    const itemIndex = cart.items.findIndex(
      (i) => i.itemId.toString() === itemId
    );

    if (itemIndex > -1) {
      cart.items[itemIndex]!.quantity = quantity;
      const savedCart = await cart.save();
      return await this.populateCart(savedCart);
    }
    return null;
  }

  // Remove specific item
  async removeItem(memberId: string, itemId: string): Promise<ICart | null> {
    const cart = await Cart.findOne({ memberId });
    if (!cart) return null;

    cart.items = cart.items.filter((i) => i.itemId.toString() !== itemId);

    const savedCart = await cart.save();
    return await this.populateCart(savedCart);
  }

  // Process checkout - reduce stock and log transactions
  async processCheckout(memberId: string, referenceId?: string): Promise<{
    success: boolean;
    message: string;
    transactionIds?: string[];
  }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Get cart with populated items
      const cart = await Cart.findOne({ memberId }).populate('items.itemId').session(session);
      if (!cart || cart.items.length === 0) {
        throw new Error('Cart is empty');
      }

      const transactionIds: string[] = [];

      // Process each cart item
      for (const cartItem of cart.items) {
        const item = cartItem.itemId as any; // Type assertion for populated item
        const quantity = cartItem.quantity;

        // Check stock availability
        if (item.stock < quantity) {
          throw new Error(`Insufficient stock for ${item.name}. Available: ${item.stock}, Requested: ${quantity}`);
        }

        // Reduce stock
        await InventoryItem.findByIdAndUpdate(
          item._id,
          { $inc: { stock: -quantity } },
          { session }
        );

        // Log sale transaction
        const transaction = await inventoryTransactionService.createTransaction({
          itemId: item._id.toString(),
          transactionType: 'OUT',
          quantity: quantity,
          reason: 'SALE',
          referenceId: referenceId,
          performedBy: memberId,
          notes: `Sale to member - Cart checkout`
        });

        transactionIds.push((transaction as any)._id.toString());
      }

      // Clear the cart
      await Cart.findOneAndUpdate(
        { memberId },
        { items: [] },
        { session }
      );

      await session.commitTransaction();

      return {
        success: true,
        message: 'Checkout processed successfully',
        transactionIds
      };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Clear entire cart
  async clearCart(memberId: string): Promise<ICart | null> {
    const cart = await Cart.findOneAndUpdate(
      { memberId },
      { items: [] },
      { new: true }
    );
    if (!cart) return null;
    return await this.populateCart(cart);
  }
}