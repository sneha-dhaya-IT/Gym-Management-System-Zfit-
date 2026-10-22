//fitness goals schema
import mongoose, { Schema, Document } from "mongoose";

export interface IFitnessGoal extends Document {
  memberId: string;
  goalType: string;   // e.g., "weight loss", "muscle gain"
  target: number;     // target weight, reps, or calories
  deadline: Date;
  status: "active" | "achieved" | "cancelled";
}

const FitnessGoalSchema: Schema = new Schema({
  memberId: { type: String, required: true },
  goalType: { type: String, required: true },
  target: { type: Number, required: true },
  deadline: { type: Date, required: true },
  status: {
    type: String,
    enum: ["active", "achieved", "cancelled"],
    default: "active",
  },
});

export default mongoose.model<IFitnessGoal>("FitnessGoal", FitnessGoalSchema);
