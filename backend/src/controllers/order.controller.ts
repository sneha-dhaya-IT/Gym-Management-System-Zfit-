import type { Request, Response, NextFunction } from "express";
import OrderService from "../services/order.service.js";
import Order from "../models/orders.model.js";

const orderService = new OrderService();

// Checkout
export const checkout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { memberId } = req.params;
    
    if (!memberId) {
      return res.status(400).json({
        success: false,
        message: "Member ID is required",
      });
    }
    
    const order = await orderService.checkout(memberId);

    res.status(201).json({
      success: true,
      message: "Checkout completed successfully",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// Get order by ID
export const getOrderById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }
    
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Order retrieved successfully",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// Get member orders
export const getMemberOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { memberId } = req.params;
    
    if (!memberId) {
      return res.status(400).json({
        success: false,
        message: "Member ID is required",
      });
    }
    
    const orders = await Order.find({ memberId }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      message: "Member orders retrieved successfully",
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};