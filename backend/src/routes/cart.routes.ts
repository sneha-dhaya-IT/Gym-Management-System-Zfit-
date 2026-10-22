import { Router } from "express";
import {
    addToCart,
    getCartByMember,
    updateCartItem,
    removeCartItem,
    clearCart,
    processCheckout
} from "../controllers/cart.controller.js";


const router = Router();

// Cart routes
router.get("/:memberId", getCartByMember);           // GET /api/v1/cart/{memberId}
router.post("/items",  addToCart);                    // POST /api/v1/cart/items
router.put("/:memberId/items/:itemId",  updateCartItem);  // PUT /api/v1/cart/{memberId}/items/{itemId}
router.delete("/:memberId/items/:itemId",  removeCartItem); // DELETE /api/v1/cart/{memberId}/items/{itemId}
router.post("/:memberId/checkout",  processCheckout); // POST /api/v1/cart/{memberId}/checkout
router.delete("/:memberId/clear",  clearCart);        // DELETE /api/v1/cart/{memberId}/clear

export default router;