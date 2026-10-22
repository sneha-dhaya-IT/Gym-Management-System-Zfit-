import mongoose, { Schema } from "mongoose";

// Interface for Facility
export interface IFacility {
  _id?: mongoose.Types.ObjectId;
  name: string;
  capacity: number;
  status?: "active" | "inactive";
  equipments?: string[]; // simple array of strings for now
  createdAt?: Date;
  updatedAt?: Date;
}

// Schema
const FacilitySchema = new Schema<IFacility>(
  {
    name: { type: String, required: true, trim: true },
    capacity: { type: Number, required: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    equipments: [{ type: String }], // keep it simple (array of strings)
  },
  { timestamps: true }
);

// Model
export const Facility = mongoose.model<IFacility>("Facility", FacilitySchema);
