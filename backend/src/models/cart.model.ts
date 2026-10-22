import mongoose, { Schema, Document } from "mongoose";

export interface ICartItem {
  itemId: mongoose.Types.ObjectId;
  quantity: number;
}

export interface ICart extends Document {
  memberId: mongoose.Types.ObjectId;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const CartSchema = new Schema<ICart>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: [
      {
        itemId: { type: Schema.Types.ObjectId, ref: "InventoryItem", required: true },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<ICart>("Cart", CartSchema);

