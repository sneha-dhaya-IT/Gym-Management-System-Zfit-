import mongoose, { Schema, Document } from "mongoose";

export interface IWorkoutLog extends Document {
  memberId: string;
  date: Date;
  workout: string;   // e.g., "Chest Day"
  duration: number;  // minutes
  notes?: string;
}

const WorkoutLogSchema = new Schema<IWorkoutLog>(
  {
    memberId: { type: String, required: true, trim: true },
    date: { type: Date, default: Date.now },
    workout: { type: String, required: true, minlength: 3, maxlength: 100 },
    duration: { type: Number, required: true, min: 1 },
    notes: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

export default mongoose.model<IWorkoutLog>("WorkoutLog", WorkoutLogSchema);
