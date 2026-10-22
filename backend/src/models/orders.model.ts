import mongoose, { Schema, Document } from "mongoose";

export interface IOrder extends Document{
    memberId: mongoose.Types.ObjectId;
    items: {
        itemId: mongoose.Types.ObjectId;
        name: string;
        price: number;
        quantity: number;
    }[];
    totalPrice : number;
    status: "pending" | "completed" | "cancelled";
    createdAt: Date;
    updatedAt: Date;
}

const orderSchema = new Schema<IOrder>({
  memberId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  items: [
    {
      itemId: { type: Schema.Types.ObjectId, ref: "InventoryItem", required: true },
      name: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true },
    }
  ],
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ["pending", "completed", "cancelled"], default: "pending" },
}, { timestamps: true });

export default mongoose.model<IOrder>("Order", orderSchema);
