import { apiRequest } from "../apiRequest";

export interface OrderItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  _id: string;
  memberId: string;
  items: OrderItem[];
  totalPrice: number;
  status: "pending" | "completed" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

export const getMemberOrders = async (memberId: string): Promise<Order[]> => {
  try {
    const response = await apiRequest<Order[]>(`/orders/member/${memberId}`);

    if (response.success && response.data) {
      return response.data;
    } else {
      throw new Error(response.message || "Failed to fetch orders");
    }
  } catch (error) {
    console.error("Error fetching member orders:", error);
    throw error;
  }
};

export const getOrderById = async (orderId: string): Promise<Order> => {
  try {
    const response = await apiRequest<Order>(`/orders/${orderId}`);

    if (response.success && response.data) {
      return response.data;
    } else {
      throw new Error(response.message || "Failed to fetch order");
    }
  } catch (error) {
    console.error("Error fetching order:", error);
    throw error;
  }
};
