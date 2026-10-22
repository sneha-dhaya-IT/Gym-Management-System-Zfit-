import mongoose, { Document, Schema, Model } from "mongoose";

// IClass: plain input type
export interface IClass {
  name: string;
  type: "yoga" | "pilates" | "zumba" | "spinning" | "crossfit" | "strength" | "cardio" | "other";
  duration: number;       // in minutes
  maxCapacity: number;    // max attendees
  price: number;
  status?: "active" | "inactive"; // optional for creation
}

// ClassDocument: Mongoose document
export interface ClassDocument extends IClass, Document {
  createdAt: Date;
  updatedAt: Date;
}

const classSchema = new Schema<ClassDocument>(
  {
    name: { type: String, required: true, trim: true },
    type: { 
      type: String, 
      enum: ["yoga","pilates","zumba","spinning","crossfit","strength","cardio","other"], 
      default: "other" 
    },
    duration: { type: Number, required: true, min: 15, max: 180 },
    maxCapacity: { type: Number, required: true, min: 1, max: 50 },
    price: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["active","inactive"], default: "active" }
  },
  { timestamps: true }
);

// Optional index for name
classSchema.index({ name: 1 });

export default mongoose.model<ClassDocument>("Class", classSchema);
