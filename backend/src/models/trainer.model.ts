import mongoose, { Schema, Document } from "mongoose";

export interface ITrainer {
  name: string;
  specialization: string;
  experience?: number; // new field for experience in years
  status?: "active" | "inactive"; 
}

// TrainerDocument: Mongoose Document type
export interface TrainerDocument extends ITrainer, Document {
  createdAt: Date;
  updatedAt: Date;
}

const trainerSchema = new Schema<TrainerDocument>(
  {
    name: { type: String, required: true },
    specialization: { type: String, required: true },
    experience: { type: Number, min: 0, default: 0 }, // added field
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true, collection: "fitness_trainers" }
);

export default mongoose.model<TrainerDocument>("Trainer", trainerSchema);
