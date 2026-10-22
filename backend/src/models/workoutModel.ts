import mongoose, { Schema, Document } from "mongoose";

export interface IWorkout extends Document {
  memberId: string;
  type: string;        // e.g., "cardio", "strength"
  duration: number;    // in minutes
  caloriesBurned: number;
  date: Date;
}

const WorkoutSchema: Schema = new Schema(
  {
    memberId: { type: String, required: true },
    type: { type: String, required: true },
    duration: { type: Number, required: true },
    caloriesBurned: { type: Number, required: true },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model<IWorkout>("Workout", WorkoutSchema);
