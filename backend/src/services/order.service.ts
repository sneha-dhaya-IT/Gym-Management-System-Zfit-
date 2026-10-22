import Order from "../models/orders.model.js";
import Cart from "../models/cart.model.js";
import InventoryItem from "../models/inventoryItem.schema.js";
import InventoryStock from "./inventoryStock.service.js";
import mongoose from "mongoose";

export default class Orderservice {
    private inventoryStock = new InventoryStock();

    async checkout(memberId: string){

        const cart = await Cart.findOne({memberId}).populate("items.itemId");

        if(!cart || cart.items.length === 0){
            throw new Error("Cart is Empty")
        }

        //prepare order items and total price
        let totalPrice = 0;
        const orderItems = [];

        for(const cartItem of cart.items){
            const item = cartItem.itemId as any;

            if(!item) throw new Error("item not found");

            if(cartItem.quantity > item.quantity){
                throw new Error(`Not enough stock for ${item.itemName}`);
            }

            // decrement stock & log transaction
            await this.inventoryStock.updateStock(item._id.toString(), cartItem.quantity, "decrement");
            
            // Add to order items
            orderItems.push({
                itemId: item._id,
                name: item.itemName,
                price: item.price,
                quantity: cartItem.quantity,
            });

            totalPrice += item.price * cartItem.quantity;
        }

        // Create the order
        const order = new Order({
            memberId: new mongoose.Types.ObjectId(memberId),
            items: orderItems,
            totalPrice,
            status: "completed",
        });

        await order.save();

        // Clear the cart
        await Cart.findOneAndUpdate({ memberId }, { items: [] });

        return order;
    }
}